export interface Translator {
    translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number, customEndpoint?: string, targetLanguage?: string, signal?: AbortSignal): Promise<string>;
    testConnection(apiKey: string, model: string, customEndpoint?: string): Promise<void>;
}