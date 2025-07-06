import { requestUrl } from 'obsidian';
import { Translator } from './index';

export class AzureOpenAITranslator implements Translator {
    async translate(content: string, apiKey: string, model: string, temperature: number, maxTokens: number, customEndpoint?: string, targetLanguage?: string, signal?: AbortSignal): Promise<string> {
        const azureDeploymentName = model; // In Azure, the model name is often the deployment name
        const apiUrl = customEndpoint || 'YOUR_AZURE_OPENAI_ENDPOINT'; // Fallback if customEndpoint is not provided

        const response = await requestUrl({
            url: `${apiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
            method: 'POST',
            headers: {
                'api-key': apiKey, // Azure OpenAI uses 'api-key' header
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: `Translate the following markdown document to ${targetLanguage}, preserving all markdown formatting:\n\n${content}` }],
                temperature: temperature,
                max_tokens: maxTokens
            })
        });
        const data = response.json;
        return data.choices[0].message.content;
    }

    async testConnection(apiKey: string, model: string, customEndpoint?: string): Promise<void> {
        const azureDeploymentName = model;
        const apiUrl = customEndpoint || 'YOUR_AZURE_OPENAI_ENDPOINT';

        await requestUrl({
            url: `${apiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: "Hello, world!" }],
                max_tokens: 5
            })
        });
    }
}
