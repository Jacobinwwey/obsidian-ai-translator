
import { AITranslatorSettings } from './types';

export const DEFAULT_SETTINGS: AITranslatorSettings = {
	llmProvider: 'openai',
	outputPath: 'translations',
    temperature: 0.7,
    maxTokens: 2048,
    targetLanguage: 'English',
    providerSettings: {
        openai: { name: 'openai', apiKey: '', model: 'gpt-4o', customEndpoint: '', temperature: 0.7 },
        google: { name: 'google', apiKey: '', model: 'gemini-pro', customEndpoint: '', temperature: 0.7 },
        anthropic: { name: 'anthropic', apiKey: '', model: 'claude-3-opus-20240229', customEndpoint: '', temperature: 0.7 },
        deepseek: { name: 'deepseek', apiKey: '', model: 'deepseek-coder', customEndpoint: '', temperature: 0.7 },
        mistral: { name: 'mistral', apiKey: '', model: 'mistral-large-latest', customEndpoint: '', temperature: 0.7 },
        openrouter: { name: 'openrouter', apiKey: '', model: 'mistralai/mistral-7b-instruct', customEndpoint: '', temperature: 0.7 },
        azureopenai: { name: 'azureopenai', apiKey: '', model: 'gpt-4o', customEndpoint: '', temperature: 0.7 },
        ollama: { name: 'ollama', apiKey: 'ollama', model: 'llama2', customEndpoint: 'http://localhost:11434/v1', temperature: 0.7 },
        lmstudio: { name: 'lmstudio', apiKey: 'lmstudio', model: 'local-model', customEndpoint: 'http://localhost:1234/v1', temperature: 0.7 },
    },
    enableStableApiCall: false,
    apiCallInterval: 5,
    apiCallMaxRetries: 3,
}

export const TRANSLATOR_SIDEBAR_VIEW_TYPE = "translator-sidebar-view";
export const TRANSLATOR_SIDEBAR_DISPLAY_TEXT = "AI Translator";
export const TRANSLATOR_SIDEBAR_ICON = "languages";
