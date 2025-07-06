
import { AITranslatorSettings } from './types';

export const DEFAULT_SETTINGS: AITranslatorSettings = {
	llmProvider: 'openai',
	outputPath: 'translations',
    temperature: 0.7,
    maxTokens: 2048,
    targetLanguage: 'English',
    providerSettings: {
        openai: { apiKey: '', model: 'gpt-4o', customEndpoint: '' },
        google: { apiKey: '', model: 'gemini-pro', customEndpoint: '' },
        anthropic: { apiKey: '', model: 'claude-3-opus-20240229', customEndpoint: '' },
        deepseek: { apiKey: '', model: 'deepseek-coder', customEndpoint: '' },
        mistral: { apiKey: '', model: 'mistral-large-latest', customEndpoint: '' },
        openrouter: { apiKey: '', model: 'mistralai/mistral-7b-instruct', customEndpoint: '' },
        azureopenai: { apiKey: '', model: 'gpt-4o', customEndpoint: '' },
        ollama: { apiKey: 'ollama', model: 'llama2', customEndpoint: 'http://localhost:11434/v1' },
        lmstudio: { apiKey: 'lmstudio', model: 'local-model', customEndpoint: 'http://localhost:1234/v1' },
    }
}

export const TRANSLATOR_SIDEBAR_VIEW_TYPE = "translator-sidebar-view";
export const TRANSLATOR_SIDEBAR_DISPLAY_TEXT = "AI Translator";
export const TRANSLATOR_SIDEBAR_ICON = "languages";
