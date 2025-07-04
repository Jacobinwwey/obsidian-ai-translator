import { requestUrl } from 'obsidian';import { Translator } from './index';export class AnthropicTranslator implements Translator {    async translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number, customEndpoint?: string, targetLanguage?: string): Promise<string> {
        const response = await requestUrl({
            url: 'https://api.anthropic.com/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: maxTokens,
                temperature: temperature,
                messages: [{ role: "user", content: `Translate the following markdown document to ${targetLanguage}, preserving all markdown formatting:\n\n${content}` }]
            })
        });
        const data = response.json;
        return data.content[0].text;
    }}