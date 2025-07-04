import { requestUrl } from 'obsidian';
import { Translator } from './index';

export class DeepseekTranslator implements Translator {
    async translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number, customEndpoint?: string, targetLanguage?: string): Promise<string> {
        const apiUrl = customEndpoint || 'https://api.deepseek.com/chat/completions';
        const response = await requestUrl({
            url: apiUrl, // Deepseek API endpoint
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: `Translate the following markdown document to ${targetLanguage}, preserving all markdown formatting:

${content}` }],
                temperature: temperature,
                max_tokens: maxTokens
            })
        });
        const data = response.json;
        return data.choices[0].message.content;
    }
}