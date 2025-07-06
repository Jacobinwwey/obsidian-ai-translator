
import { ProviderSettings } from './types';

export async function testAPI(providerName: string, provider: ProviderSettings): Promise<{ success: boolean; message: string }> {
    try {
        let response: Response;
        let url: string;
        let options: RequestInit = { method: 'GET' }; // Default to GET

        switch (providerName) {
            case 'ollama':
                url = `${provider.customEndpoint}/tags`;
                options.headers = { 'Content-Type': 'application/json' };
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Ollama API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Ollama at ${provider.customEndpoint} and listed models.` };

            case 'lmstudio':
                const lmStudioUrl = `${provider.customEndpoint}/chat/completions`;
                const lmStudioOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey || 'EMPTY'}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant' },
                            { role: 'user', content: 'Hello' }
                        ],
                        temperature: 0.7,
                        max_tokens: 10
                    })
                };
                try {
                    response = await fetch(lmStudioUrl, lmStudioOptions);
                    if (response.ok) {
                        try { await response.json(); } catch (jsonError) { console.warn("LMStudio test connection response was not valid JSON, but status was OK. Assuming success."); }
                        return { success: true, message: `Successfully connected to LMStudio API at ${provider.customEndpoint} using model '${provider.model}'.` };
                    } else {
                        const errorText = await response.text();
                        if (errorText.includes("Could not find model")) { throw new Error(`LMStudio API error: Model '${provider.model}' not found or loaded on the server.`); }
                        throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
                    }
                } catch (e: unknown) { // Changed to unknown
                    const message = e instanceof Error ? e.message : String(e);
                    throw new Error(`LMStudio API connection failed: ${message}. Is the server running at ${provider.customEndpoint}?`);
                }

            case 'openrouter':
                url = `https://openrouter.ai/api/v1/chat/completions`;
                options.method = 'POST';
                options.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`,
                };
                options.body = JSON.stringify({
                    model: provider.model,
                    messages: [{ role: 'user', content: 'Test connection' }],
                    max_tokens: 1,
                    temperature: 0
                });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to OpenRouter API using model '${provider.model}'.` };

            case 'openai':
                 url = `https://api.openai.com/v1/models`;
                 options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                 response = await fetch(url, options);
                 if (!response.ok) {
                     url = `https://api.openai.com/v1/chat/completions`;
                     options.method = 'POST';
                     options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                     options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                     response = await fetch(url, options);
                 }
                 if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to OpenAI API.` };

            case 'deepseek':
                url = `https://api.deepseek.com/v1/models`;
                options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                response = await fetch(url, options);
                if (!response.ok) {
                    url = `https://api.deepseek.com/v1/chat/completions`;
                    options.method = 'POST';
                    options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                    options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                    response = await fetch(url, options);
                }
                if (!response.ok) throw new Error(`${providerName} API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to ${providerName} API.` };

            case 'mistral':
                 url = `https://api.mistral.ai/v1/models`;
                 options.headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                 response = await fetch(url, options);
                 if (!response.ok) {
                     url = `https://api.mistral.ai/v1/chat/completions`;
                     options.method = 'POST';
                     options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                     options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                     response = await fetch(url, options);
                 }
                 if (!response.ok) throw new Error(`Mistral API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to Mistral API.` };

            case 'anthropic':
                url = `https://api.anthropic.com/v1/messages`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' };
                options.body = JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Anthropic API.` };

            case 'google':
                url = `https://generativelanguage.googleapis.com/v1/models/${provider.model}:generateContent?key=${provider.apiKey}`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Google API.` };

            case 'azureopenai':
                if (!provider.customEndpoint || !provider.model) { throw new Error('Azure requires a Custom Endpoint and Model (Deployment Name).'); }
                url = `${provider.customEndpoint}/openai/deployments/${provider.model}/chat/completions?api-version=2024-02-15-preview`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'api-key': provider.apiKey };
                options.body = JSON.stringify({ messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Azure OpenAI API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Azure OpenAI deployment '${provider.model}'.` };

            default:
                return { success: false, message: `Connection test not implemented for provider: ${providerName}` };
        }
    } catch (error: unknown) { // Changed to unknown
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Connection test failed for ${providerName}:`, error);
        return { success: false, message: `Connection failed: ${message}` };
    }
}
