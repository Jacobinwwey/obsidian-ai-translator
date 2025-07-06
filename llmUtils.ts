import { Notice } from 'obsidian';
import { ProviderSettings, AITranslatorSettings, ProgressReporter } from './types';

export function cancellableDelay(ms: number, progressReporter: ProgressReporter): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            resolve();
        }, ms);

        const intervalId = setInterval(() => {
            if (progressReporter.cancelled) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                reject(new Error("Processing cancelled by user during API retry wait."));
            }
        }, 100);
    });
}

export async function testAPI(providerName: string, providerConfig: ProviderSettings): Promise<{ success: boolean; message: string }> {
    try {
        let response: Response;
        let url: string;
        let options: RequestInit = { method: 'GET' }; // Default to GET

        switch (providerName) {
            case 'ollama':
                url = `${providerConfig.customEndpoint}/tags`;
                options.headers = { 'Content-Type': 'application/json' };
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Ollama API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Ollama at ${providerConfig.customEndpoint} and listed models.` };

            case 'lmstudio':
                const lmStudioUrl = `${providerConfig.customEndpoint}/chat/completions`;
                const lmStudioOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${providerConfig.apiKey || 'EMPTY'}`
                    },
                    body: JSON.stringify({
                        model: providerConfig.model,
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
                        return { success: true, message: `Successfully connected to LMStudio API at ${providerConfig.customEndpoint} using model '${providerConfig.model}'.` };
                    } else {
                        const errorText = await response.text();
                        if (errorText.includes("Could not find model")) { throw new Error(`LMStudio API error: Model '${providerConfig.model}' not found or loaded on the server.`); }
                        throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
                    }
                } catch (e: unknown) { // Changed to unknown
                    const message = e instanceof Error ? e.message : String(e);
                    throw new Error(`LMStudio API connection failed: ${message}. Is the server running at ${providerConfig.customEndpoint}?`);
                }

            case 'openrouter':
                url = `https://openrouter.ai/api/v1/chat/completions`;
                options.method = 'POST';
                options.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerConfig.apiKey}`,
                };
                options.body = JSON.stringify({
                    model: providerConfig.model,
                    messages: [{ role: 'user', content: 'Test connection' }],
                    max_tokens: 1,
                    temperature: 0
                });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to OpenRouter API using model '${providerConfig.model}'.` };

            case 'openai':
                 url = `${providerConfig.customEndpoint || 'https://api.openai.com/v1'}/models`;
                 options.headers = { 'Authorization': `Bearer ${providerConfig.apiKey}` };
                 response = await fetch(url, options);
                 if (!response.ok) {
                     url = `${providerConfig.customEndpoint || 'https://api.openai.com/v1'}/chat/completions`;
                     options.method = 'POST';
                     options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                     options.body = JSON.stringify({ model: providerConfig.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                     response = await fetch(url, options);
                 }
                 if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to OpenAI API.` };

            case 'deepseek':
                url = `https://api.deepseek.com/v1/models`;
                options.headers = { 'Authorization': `Bearer ${providerConfig.apiKey}` };
                response = await fetch(url, options);
                if (!response.ok) {
                    url = `https://api.deepseek.com/v1/chat/completions`;
                    options.method = 'POST';
                    options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                    options.body = JSON.stringify({ model: providerConfig.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                    response = await fetch(url, options);
                }
                if (!response.ok) throw new Error(`${providerName} API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to ${providerName} API.` };

            case 'mistral':
                 url = `https://api.mistral.ai/v1/models`;
                 options.headers = { 'Authorization': `Bearer ${providerConfig.apiKey}` };
                 response = await fetch(url, options);
                 if (!response.ok) {
                     url = `https://api.mistral.ai/v1/chat/completions`;
                     options.method = 'POST';
                     options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                     options.body = JSON.stringify({ model: providerConfig.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                     response = await fetch(url, options);
                 }
                 if (!response.ok) throw new Error(`Mistral API error: ${response.status} - ${await response.text()}`);
                 await response.json();
                 return { success: true, message: `Successfully connected to Mistral API.` };

            case 'anthropic':
                url = `${providerConfig.customEndpoint}/v1/messages`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'x-api-key': providerConfig.apiKey, 'anthropic-version': '2023-06-01' };
                options.body = JSON.stringify({ model: providerConfig.model, messages: [{ role: 'user', content: 'Test' }], max_tokens: 1 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Anthropic API.` };

            case 'google':
                // Corrected URL construction for Google API test
                url = `${providerConfig.customEndpoint || 'https://generativelanguage.googleapis.com'}/v1beta/models/${providerConfig.model}:generateContent?key=${providerConfig.apiKey}`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Google API.` };

            case 'azureopenai':
                if (!providerConfig.customEndpoint || !providerConfig.model) { throw new Error('Azure requires a Custom Endpoint and Model (Deployment Name).'); }
                url = `${providerConfig.customEndpoint}/openai/deployments/${providerConfig.model}/chat/completions?api-version=2024-02-15-preview`;
                options.method = 'POST';
                options.headers = { 'Content-Type': 'application/json', 'api-key': providerConfig.apiKey };
                options.body = JSON.stringify({ messages: [{ role: 'user', content: 'Test' }], max_tokens: 1, temperature: 0 });
                response = await fetch(url, options);
                if (!response.ok) throw new Error(`Azure OpenAI API error: ${response.status} - ${await response.text()}`);
                await response.json();
                return { success: true, message: `Successfully connected to Azure OpenAI deployment '${providerConfig.model}'.` };

            default:
                return { success: false, message: `Connection test not implemented for provider: ${providerName}` };
        }
    } catch (error: unknown) { // Changed to unknown
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Connection test failed for ${providerName}:`, error);
        return { success: false, message: `Connection failed: ${message}` };
    }
}

export async function callApiWithRetry(
    providerName: string,
    providerConfig: ProviderSettings,
    prompt: string,
    content: string,
    settings: AITranslatorSettings,
    progressReporter: ProgressReporter,
    apiCallFunction: (providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter) => Promise<string>
): Promise<string> {
    
    let lastError: Error | null = null;
    const maxAttempts = settings.enableStableApiCall ? settings.apiCallMaxRetries + 1 : 1;
    const intervalSeconds = settings.enableStableApiCall ? settings.apiCallInterval : 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (progressReporter.cancelled) {
            throw new Error("Processing cancelled by user before API attempt.");
        }

        const controller = new AbortController();
        progressReporter.abortController = controller;

        try {
            return await apiCallFunction(providerConfig, prompt, content, controller.signal, settings, progressReporter);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            lastError = error instanceof Error ? error : new Error(errorMessage);
            console.warn(`${providerName} API Call: Attempt ${attempt} failed: ${errorMessage}`);

            if (controller.signal.aborted || errorMessage.includes("cancelled by user")) {
                throw new Error("API call cancelled by user.");
            }

            const httpStatusMatch = errorMessage.match(/API error: (\d+)/);
            const httpStatusCode = httpStatusMatch ? parseInt(httpStatusMatch[1], 10) : null;
            if (httpStatusCode && (httpStatusCode === 400 || httpStatusCode === 401 || httpStatusCode === 403 || httpStatusCode === 404)) {
                throw lastError;
            }
            
            if (progressReporter.cancelled) {
                throw new Error("Processing cancelled by user during API retry sequence.");
            }

            if (attempt < maxAttempts) {
                progressReporter.log(`Waiting ${intervalSeconds} seconds before retry ${attempt + 1}...`);
                await cancellableDelay(intervalSeconds * 1000, progressReporter);
            }
        } finally {
            if (progressReporter.abortController === controller) {
                progressReporter.abortController = null;
            }
        }
    }

    console.error(`${providerName} API Call: All ${maxAttempts} attempts failed.`);
    throw lastError || new Error(`${providerName} API call failed after multiple retries.`);
}

export async function executeOpenAIApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for OpenAI provider.`);
    const url = providerConfig.customEndpoint || `https://api.openai.com/v1`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling OpenAI API at ${url}/chat/completions...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/chat/completions`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerConfig.apiKey}` }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from OpenAI API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`OpenAI API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from OpenAI API`); }
    return data.choices[0].message.content;
}

export async function executeGoogleApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for Google provider.`);
    const urlWithKey = `${providerConfig.customEndpoint || 'https://generativelanguage.googleapis.com'}/v1beta/models/${providerConfig.model}:generateContent?key=${providerConfig.apiKey}`;
    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] }],
        generationConfig: { temperature: providerConfig.temperature, maxOutputTokens: settings.maxTokens }
    };
    progressReporter.log(`Calling Google API at ${urlWithKey}...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(urlWithKey, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from Google API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`Google API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) { throw new Error(`Unexpected response format from Google API`); }
    return data.candidates[0].content.parts[0].text;
}

export async function executeAnthropicApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for Anthropic provider.`);
    const url = providerConfig.customEndpoint || `https://api.anthropic.com`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'user', content: `${prompt}\n\n${content}` }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling Anthropic API at ${url}/v1/messages...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/v1/messages`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'x-api-key': providerConfig.apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from Anthropic API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`Anthropic API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.content?.[0]?.text) { throw new Error(`Unexpected response format from Anthropic API`); }
    return data.content[0].text;
}

export async function executeDeepseekApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for DeepSeek provider.`);
    const url = providerConfig.customEndpoint || `https://api.deepseek.com`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling DeepSeek API at ${url}/chat/completions...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/chat/completions`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerConfig.apiKey}` }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from DeepSeek API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from DeepSeek API`); }
    return data.choices[0].message.content;
}

export async function executeMistralApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for Mistral provider.`);
    const url = providerConfig.customEndpoint || `https://api.mistral.ai/v1`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling Mistral API at ${url}/chat/completions...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/chat/completions`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerConfig.apiKey}` }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from Mistral API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`Mistral API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Mistral API`); }
    return data.choices[0].message.content;
}

export async function executeOpenRouterApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for OpenRouter provider.`);
    const url = providerConfig.customEndpoint || `https://openrouter.ai/api/v1`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling OpenRouter API at ${url}/chat/completions...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/chat/completions`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerConfig.apiKey}` }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from OpenRouter API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from OpenRouter API`); }
    return data.choices[0].message.content;
}

export async function executeAzureOpenAIApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    if (!providerConfig.apiKey) throw new Error(`API key is missing for Azure OpenAI provider.`);
    if (!providerConfig.customEndpoint || !providerConfig.model) { throw new Error('Azure requires a Custom Endpoint and Model (Deployment Name).'); }
    const url = `${providerConfig.customEndpoint}/openai/deployments/${providerConfig.model}/chat/completions?api-version=2024-02-15-preview`;
    const requestBody = {
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling Azure OpenAI API at ${url}...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(url, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'api-key': providerConfig.apiKey }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from Azure OpenAI API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from Azure OpenAI API`); }
    return data.choices[0].message.content;
}

export async function executeOllamaApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    const url = providerConfig.customEndpoint || `http://localhost:11434`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        options: { temperature: providerConfig.temperature, num_predict: settings.maxTokens },
        stream: false
    };
    progressReporter.log(`Calling Ollama API at ${url}/api/chat...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/api/chat`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from Ollama API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`Ollama API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.message?.content) { throw new Error(`Unexpected response format from Ollama`); }
    return data.message.content;
}

export async function executeLMStudioApi(providerConfig: ProviderSettings, prompt: string, content: string, signal: AbortSignal, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
    const url = providerConfig.customEndpoint || `http://localhost:1234`;
    const requestBody = {
        model: providerConfig.model,
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: content }],
        temperature: providerConfig.temperature,
        max_tokens: settings.maxTokens
    };
    progressReporter.log(`Calling LMStudio API at ${url}/v1/chat/completions...`);
    await cancellableDelay(50, progressReporter);
    const response = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST', signal: signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerConfig.apiKey || 'EMPTY'}` }, body: JSON.stringify(requestBody)
    });
    progressReporter.log(`Received response from LMStudio API. Status: ${response.status}`);
    await cancellableDelay(50, progressReporter);
    if (!response.ok) { const errorText = await response.text(); throw new Error(`LMStudio API error: ${response.status} - ${errorText}`); }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) { throw new Error(`Unexpected response format from LMStudio`); }
    return data.choices[0].message.content;
}
