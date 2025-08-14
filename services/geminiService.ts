
import { GoogleGenAI } from "@google/genai";
import { AuthConfig, Endpoint, AuthMethod, DatabaseType, AiModelConfig } from '../types';

interface GenerationParams {
  authConfig: AuthConfig;
  endpoints: Endpoint[];
  baseUri: string;
  namespace: string;
}

export interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const snakeToPascal = (s: string) => s.replace(/(^\w|_\w)/g, m => m.replace('_', '').toUpperCase());

const getAuthPromptSection = (authConfig: AuthConfig): string => {
  switch (authConfig.method) {
    case AuthMethod.BEARER:
      return `Implement Bearer Token authentication. The constructor MUST accept a token string (e.g., \`${authConfig.tokenVariableName}\`). This token MUST be passed in the 'Authorization: Bearer <token>' header for every request.`;
    case AuthMethod.BASIC:
      return `Implement Basic authentication. The constructor MUST accept username and password strings (e.g., \`${authConfig.usernameVariableName}\`, \`${authConfig.passwordVariableName}\`). These credentials MUST be Base64 encoded and passed in the 'Authorization: Basic <encoded>' header for every request.`;
    case AuthMethod.QUERY:
      return `Implement API Key in Query Parameter authentication. The constructor MUST accept an API key string (e.g., \`${authConfig.queryValueName}\`). This key MUST be added as a query parameter \`${authConfig.queryKeyName}=<key>\` to every request.`;
    case AuthMethod.CHAINED:
      return `Implement a Chained Token authentication flow.
- The constructor SHOULD accept any credentials needed for the token request (e.g., client ID, secret).
- A private property, e.g., \`$accessToken\`, should store the fetched token.
- A public method, e.g., \`authenticate()\`, MUST exist to perform the token request. This method sends a ${authConfig.tokenEndpointMethod} request to \`${authConfig.tokenEndpointPath}\` with the following JSON body: \`${authConfig.requestBody}\`. It must parse the JSON response and extract the token from the path: \`${authConfig.tokenPathInResponse}\`.
- The main \`sendRequest\` helper MUST check if a token exists. If not, it MUST call \`authenticate()\` first.
- All subsequent API calls MUST include the 'Authorization: ${authConfig.schemeInHeader} <token>' header.`;
    default:
      return 'No authentication is required.';
  }
};

const getDtoAndDbPrompts = (endpoints: Endpoint[]): { dtoPrompt: string, dbHandlerPrompt: string, clientMethodReturns: Map<string, string> } => {
    let dtoPrompt = '';
    let dbHandlerPrompt = '';
    const clientMethodReturns = new Map<string, string>();
    const dbEndpoints = endpoints.filter(ep => ep.dbConfig.enabled && ep.responsePayload);
    
    // DTOs
    const endpointsWithPayload = endpoints.filter(ep => ep.responsePayload);
    const dtoNames = new Set<string>();

    for (const ep of endpointsWithPayload) {
        const baseName = snakeToPascal(ep.name.replace(/^get(s?)/, ''));
        const isList = ep.responsePayload.trim().startsWith('[');
        const dtoName = isList ? `${baseName}Item` : baseName;
        const returnType = isList ? `array<${dtoName}>` : dtoName;

        if (dtoNames.has(dtoName)) continue;
        dtoNames.add(dtoName);

        dtoPrompt += `
### DTO Class: ${dtoName}
- Generate a readonly DTO class named \`${dtoName}\`.
- Its properties should be derived from the following JSON object structure.
- All properties MUST be \`public readonly\`.
- Use native PHP types. For nested objects, generate separate DTO classes if necessary and use them as type hints.
- JSON for \`${dtoName}\`: \`\`\`json\n${isList ? ep.responsePayload.trim().slice(1, -1).split('},{')[0] + '}' : ep.responsePayload}\n\`\`\`
`;
        clientMethodReturns.set(ep.name, returnType);
    }
    
    // DB Handler
    if (dbEndpoints.length > 0) {
        dbHandlerPrompt = `
## Section 4: Database Handler Class
Generate a class named \`ApiClientDbHandler\`.
- It MUST have a constructor that accepts a \`\\PDO\` instance.
- For each DTO that can be persisted, generate a corresponding \`save\` method.
`;
        const processedDtosForDb = new Set<string>();
        for (const ep of dbEndpoints) {
            const returnType = clientMethodReturns.get(ep.name);
            if (!returnType || processedDtosForDb.has(returnType)) continue;
            
            const dtoName = returnType.includes('array') ? returnType.replace('array<', '').replace('>', '') : returnType;
            processedDtosForDb.add(dtoName);
            
            let upsertSql: string;
            switch(ep.dbConfig.dbType) {
                case DatabaseType.POSTGRESQL:
                case DatabaseType.SQLITE:
                    upsertSql = 'Use an `INSERT ... ON CONFLICT(id) DO UPDATE SET ...` statement.';
                    break;
                case DatabaseType.MARIADB:
                default:
                    upsertSql = 'Use an `INSERT ... ON DUPLICATE KEY UPDATE ...` statement.';
                    break;
            }

            dbHandlerPrompt += `
### Method: save${dtoName}
- Create a public method \`save${dtoName}(\` that accepts one argument: \`${dtoName} \$dto\`.
- This method persists the DTO data to the \`${ep.dbConfig.tableName}\` table.
- Assume the DTO has an \`id\` property that is the primary key.
- The method must perform an "upsert" operation. ${upsertSql}
- Map the DTO properties to the table columns (assuming snake_case column names from camelCase DTO properties).
`;
        }
    }

    return { dtoPrompt, dbHandlerPrompt, clientMethodReturns };
};

const getEndpointsPromptSection = (endpoints: Endpoint[], clientMethodReturns: Map<string, string>): string => {
  if (endpoints.length === 0) return 'No endpoints specified.';
  
  const endpointDetails = endpoints.map(ep => {
    const pathParams = (ep.path.match(/\{(\w+)\}/g) || []).map(p => p.slice(1, -1));
    const paramSignature = pathParams.map(p => `string $${p}`).join(', ');
    
    let methodArgs = pathParams.length > 0 ? `${paramSignature}, ` : '';
    if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      methodArgs += 'array $body = []';
    } else {
      methodArgs += 'array $queryParams = []';
    }

    const returnType = clientMethodReturns.get(ep.name) || 'array';
    let returnDoc = `* @return ${returnType} The decoded JSON response or a DTO.`;
    if(returnType !== 'array') {
        returnDoc += `\n     * @throws ApiClientException On API error.`
    }


    return `- **Method:** \`public function ${ep.name}(${methodArgs.trim().replace(/,$/, '')})\`
  - **HTTP Method:** ${ep.method}
  - **Path:** \`${ep.path}\` (substitute path variables)
  - **Parameters:** Handle path params, request body (for POST/PUT/PATCH), and query params appropriately.
  - **Return Value:** 
    /**
     ${returnDoc}
     */
    The method MUST return a value of type \`${returnType}\`. If the type is a DTO, instantiate it from the response data. If it is an array of DTOs, return an array of instantiated DTOs.
    `;
  }).join('\n');
  
  return `## Section 3: API Client Class
Generate the main client class, \`Client\`.
- **Constructor:** Inject \`ClientInterface\`, \`RequestFactoryInterface\`, \`StreamFactoryInterface\`, and a \`LoggerInterface\`. Also accept auth credentials.
- **Helper Method:** Create a private \`sendRequest\` method to encapsulate request creation, sending, and response handling logic. It must perform logging.
- **Public Methods:** Generate a public method for each of the following endpoints:\n${endpointDetails}`;
};


const constructPrompt = ({ authConfig, endpoints, baseUri, namespace }: GenerationParams): string => {
  const { dtoPrompt, dbHandlerPrompt, clientMethodReturns } = getDtoAndDbPrompts(endpoints);
  const authPrompt = getAuthPromptSection(authConfig);
  const endpointsPrompt = getEndpointsPromptSection(endpoints, clientMethodReturns);
  const safeNamespace = namespace.replace(/\\/g, '\\\\');

  return `
You are an expert PHP developer creating a modern, PSR-compliant API client.
Generate a complete, single PHP file. The output MUST be only valid PHP code. Do NOT add any other text or markdown like \`\`\`php.

**PHP Standards:**
- PHP 8.1+ compatibility.
- \`declare(strict_types=1);\`.
- PSR-12 style.
- Use PSR-3 (Logger), PSR-7 (HTTP Messages), PSR-17 (HTTP Factories), PSR-18 (HTTP Client).
- Use the namespace \`${safeNamespace}\`.

---

**FILE STRUCTURE:**

## Section 1: Exception Class
- Define a custom exception \`ApiClientException extends \\RuntimeException\`.

${dtoPrompt ? `## Section 2: Data Transfer Objects (DTOs)\n${dtoPrompt}` : ''}

${endpointsPrompt}
  - **Base URI:** The base URI is \`${baseUri}\`.
  - **Authentication:** ${authPrompt}
  - **Error Handling:** Throw \`ApiClientException\` on non-2xx HTTP status codes.
  - **Logging:** Use the injected PSR-3 logger to log requests, responses, and errors.

${dbHandlerPrompt}
`;
};


export const streamPhpClientCode = async (
    params: GenerationParams, 
    modelConfig: AiModelConfig,
    apiKey: string,
    onChunk: (chunk: string) => void
): Promise<void> => {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = constructPrompt(params);
  
  const generationConfig: any = {
    temperature: modelConfig.temperature, 
    topP: modelConfig.topP,
    topK: modelConfig.topK,
    responseMimeType: 'text/plain',
  };

  if (modelConfig.model === 'gemini-2.5-flash' && modelConfig.thinkingBudget && modelConfig.thinkingBudget > 0) {
      generationConfig.thinkingConfig = { thinkingBudget: modelConfig.thinkingBudget };
  }
  
  try {
    const response = await ai.models.generateContentStream({
      model: modelConfig.model,
      contents: prompt,
      config: generationConfig,
    });

    for await (const chunk of response) {
      onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.message.includes('SAFETY')) {
        throw new Error("Failed to generate code due to safety settings. Please adjust your query.");
    }
    throw new Error("Failed to generate code. The AI model may be temporarily unavailable or the request was invalid.");
  }
};

export const configSystemInstruction = `You are an expert API design assistant. Your goal is to help a user configure a PHP API client by asking clarifying questions.
The user will provide an initial description. You must analyze it and ask targeted questions to determine ALL of the following:
1.  \`baseUri\`: The base URL for the API.
2.  \`namespace\`: A valid PHP namespace (e.g., App\\Sdk\\MyApi).
3.  \`authConfig\`: The authentication method. You must determine the \`method\` (one of: 'none', 'bearer', 'basic', 'query', 'chained') and any required fields for that method based on the user's description.
4.  \`endpoints\`: A list of API endpoints. For each endpoint, you need:
    - \`name\`: a camelCase function name (e.g., 'getUserById').
    - \`method\`: An HTTP verb ('GET', 'POST', 'PUT', 'PATCH', 'DELETE').
    - \`path\`: The URL path (e.g., '/users/{id}').
    - \`responsePayload\`: A sample JSON string representing the response body. If the user doesn't provide one, create a sensible example.
    - \`dbConfig\`: Default this to \`{ "enabled": false, "dbType": "mariadb", "tableName": "" }\`.

Ask concise questions, one or two at a time, to avoid overwhelming the user.
When you are confident you have ALL the necessary information, and ONLY then, respond with a single JSON object enclosed in a \`\`\`json markdown block. This JSON object must be the final configuration and nothing else. The JSON object must have the keys: \`baseUri\`, \`namespace\`, \`authConfig\`, and \`endpoints\`. Do not say anything else before or after the JSON block.

If you still need information, just ask the next question(s) in plain text.`;
