export interface Translator {
    translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number, customEndpoint?: string, targetLanguage?: string): Promise<string>;
}