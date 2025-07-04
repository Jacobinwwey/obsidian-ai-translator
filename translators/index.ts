export interface Translator {
    translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string>;
}