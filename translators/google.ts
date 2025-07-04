import { requestUrl } from 'obsidian';
import { Translator } from './index';

export class GoogleAITranslator implements Translator {
    async translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
        const response = await requestUrl({
            url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Translate the following markdown document to English, preserving all markdown formatting:\n\n${content}`
                    }]
                }],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens
                }
            })
        });

        const data = response.json;
        return data.candidates[0].content.parts[0].text;
    }
}