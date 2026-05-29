
import { GoogleGenAI } from "@google/genai";
import { AuthConfig, Endpoint, AuthMethod, DatabaseType, AiModelConfig, HeaderPair, ContentType, ResilienceConfig, DocConfig } from '../types';

interface GenerationParams {
  authConfig: AuthConfig;
  endpoints: Endpoint[];
  baseUri: string;
  namespace: string;
  globalHeaders: HeaderPair[];
  defaultContentType: ContentType;
  resilienceConfig: ResilienceConfig;
  docConfig: DocConfig;
}

export interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const snakeToPascal = (s: string) => s.replace(/(^\w|_\w)/g, m => m.replace('_', '').toUpperCase());

const getAuthPromptSection = (authConfig: AuthConfig): string => {
  switch (authConfig.method) {
    case AuthMethod.BEARER:
      return `Implement Bearer Token authentication. Constructor requires \`${authConfig.tokenVariableName}\`. Use 'Authorization: Bearer <token>' header.`;
    case AuthMethod.BASIC:
      return `Implement Basic authentication. Constructor requires \`${authConfig.usernameVariableName}\` and \`${authConfig.passwordVariableName}\`. Base64 encode and use 'Authorization: Basic <encoded>'.`;
    case AuthMethod.QUERY:
      return `Implement API Key in Query Param \`${authConfig.queryKeyName}\`. Constructor requires \`${authConfig.queryValueName}\`.`;
    case AuthMethod.CHAINED:
      const scopeInstruction = authConfig.tokenRequestScopes?.length 
        ? `\n    - Include a \`scope\` parameter in the token request body: \`${authConfig.tokenRequestScopes.join(' ')}\`.`
        : '';

      return `Implement high-performance Chained OAuth2 flow:
- **Dependency Injection**: PSR-16/PSR-6 Cache for persistence.
- **Acquisition Request**: Send a ${authConfig.tokenEndpointMethod} to \`${authConfig.tokenEndpointPath}\`.
- **Payload**: ${authConfig.tokenRequestContentType} with template tag injection \`{{key}}\` using constructor args: \`${authConfig.constructorArgs?.join(', ')}\`.
- **Scopes**: ${scopeInstruction}
- **Dynamic Extraction**: Use Support\\Arr to find the token at path \`${authConfig.tokenPathInResponse}\`.`;
    default:
      return 'No authentication required.';
  }
};

const getDtoAndDbPrompts = (endpoints: Endpoint[]): { dtoPrompt: string, dbHandlerPrompt: string, clientMethodReturns: Map<string, string> } => {
    let dtoPrompt = '';
    let dbHandlerPrompt = '';
    const clientMethodReturns = new Map<string, string>();
    const dbEndpoints = endpoints.filter(ep => ep.dbConfig.enabled && ep.responsePayload);
    
    for (const ep of endpoints.filter(e => e.responsePayload)) {
        const baseName = snakeToPascal(ep.name.replace(/^get(s?)/, ''));
        const isList = ep.responsePayload!.trim().startsWith('[');
        const dtoName = isList ? `${baseName}Item` : baseName;
        const returnType = isList ? `array<${dtoName}>` : dtoName;

        dtoPrompt += `### DTO: ${dtoName}\nPHP 8.2+ readonly class. Include property type hints and docblocks. Mapped from:\n\`\`\`json\n${ep.responsePayload}\n\`\`\`\n`;
        clientMethodReturns.set(ep.name, returnType);
    }
    
    if (dbEndpoints.length > 0) {
        dbHandlerPrompt = `## Persistence Bridge\nGenerate \`ApiClientDbHandler\` injecting a \`PDO\` instance. Methods for: ${dbEndpoints.map(e => `save${snakeToPascal(e.name)}`).join(', ')}. Support upsert (ON DUPLICATE KEY UPDATE or similar) based on ${dbEndpoints[0].dbConfig.dbType}.`;
    }

    return { dtoPrompt, dbHandlerPrompt, clientMethodReturns };
};

const constructPrompt = (params: GenerationParams): string => {
  const { dtoPrompt, dbHandlerPrompt, clientMethodReturns } = getDtoAndDbPrompts(params.endpoints);
  const authPrompt = getAuthPromptSection(params.authConfig);
  const safeNamespace = params.namespace.replace(/\\/g, '\\\\');

  const helperDirectives = params.docConfig.includeExtendedHelpers ? `
## Extended Support Helpers (src/Support/*):
- \`Support\\Arr\`: Static \`get()\` method for deep array retrieval using dot-notation.
- \`Support\\Url\`: Safe URI builder with template placeholder substitution.
- \`Support\\Config\`: Typed, immutable container for client settings.
` : '';

  const wpDirectives = params.docConfig.includeWpCustomFields ? `
## Advanced Meta Field Mapping (ACF/SCF):
- Explicitly support WordPress Advanced Custom Fields (ACF) and Secure Custom Fields (SCF) response patterns.
- Ensure extraction rules targeting \`acf.*\` or \`scf.*\` paths are handled correctly.
- Add specific hydration logic to handle potential WP REST API nested objects for these fields.
` : '';

  const extractionDirectives = params.endpoints.filter(e => e.extractionRules && e.extractionRules.length > 0)
    .map(e => {
      const rules = e.extractionRules.map(r => `- Extracted Property \`${r.property}\` from path \`${r.path}\``).join('\n');
      return `Endpoint \`${e.name}\` dynamic retrieval rules:\n${rules}`;
    }).join('\n\n');

  return `
You are a Principal PHP Software Engineer. Your task is to generate a PRODUCTION-READY, PSR-compliant SDK.
Target PHP: 8.2+. Standard: PSR-3, PSR-7, PSR-17, PSR-18.
Namespace: \`${safeNamespace}\`.

Format: --- START OF FILE [filename] ---

${helperDirectives}
${wpDirectives}

**Architecture Guide:**
- Use strict typing (\`declare(strict_types=1);\`) in every file.
- Error Handling: Create a base \`ApiClientException\` and specific subclasses for 4xx/5xx/Connection errors.
- Resilience Strategy: Exponential backoff with ${params.resilienceConfig.maxRetries} max retries and ${params.resilienceConfig.baseDelay}ms base delay.
- Auth Layer: ${authPrompt}
- Base URI: \`${params.baseUri}\`.

**Dynamic Data Extraction:**
${extractionDirectives}
When extraction rules are present, use the \`Support\\Arr::get()\` helper to pull values before returning or persisting data.

**File Manifest:**
- \`composer.json\`: ${params.docConfig.generateComposer ? 'Standard composer definition with PSR dependencies.' : 'Exclude.'}
- \`README.md\`: ${params.docConfig.generateReadme ? 'High-quality technical documentation with code examples.' : 'Exclude.'}
- \`src/Client.php\`: The main orchestration hub.
- \`src/Dto/*.php\`: Clean, typed data objects.
${dtoPrompt}
- \`src/Support/Arr.php\`: Robust dot-notation array helper.
- \`src/Database/ApiClientDbHandler.php\`: ${dbHandlerPrompt ? 'Persistence layer.' : 'Exclude.'}

Generate ONLY the code package using the specified file delimiters. Ensure the logic for "Reviews & Testimonials" or "WP Custom Fields" is contextually perfect.
`;
};

export const streamPhpClientCode = async (params: GenerationParams, modelConfig: AiModelConfig, onChunk: (chunk: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContentStream({
    model: modelConfig.model,
    contents: constructPrompt(params),
    config: { 
      temperature: modelConfig.temperature, 
      topP: modelConfig.topP, 
      topK: modelConfig.topK,
      thinkingConfig: modelConfig.thinkingBudget && modelConfig.thinkingBudget > 0 ? { thinkingBudget: modelConfig.thinkingBudget } : undefined
    },
  });
  for await (const chunk of response) {
      if (chunk.text) onChunk(chunk.text);
  }
};

export const configSystemInstruction = `You are a Principal SDK Architect working in a collaborative AI environment.
Task: Help the user configure a complex PHP API SDK.

Collaboration Context:
A local Insight Agent (Built-in AI) may have pre-analyzed the user's request. Pay close attention to any "LOCAL AI CRITIQUE" provided in the prompt, as it often contains important technical refinements or edge-case considerations based on the immediate project environment.

Context Awareness Rules:
1. If the user mentions "WordPress", "ACF", or "Custom Fields", automatically suggest extraction rules and the WP field helper.
2. If the user mentions "Reviews" or "Feedback", propose a schema with ratings, comments, and author metadata.
3. Be proactive: if an endpoint path has variables like {id}, ensure they are accounted for in the method signature.
4. Always prioritize PSR-compliant, high-performance code architecture.

Respond ONLY with a JSON configuration block for the app: baseUri, namespace, authConfig, docConfig, endpoints.`;
