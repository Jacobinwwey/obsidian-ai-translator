import { Translator } from './index';
import { OpenAITranslator } from './openai';
import { GoogleAITranslator } from './google';
import { AnthropicTranslator } from './anthropic';
import { DeepseekTranslator } from './deepseek';
import { MistralTranslator } from './mistral';
import { OpenRouterTranslator } from './openrouter';
import { AzureOpenAITranslator } from './azureopenai';

export function createTranslator(provider: string): Translator {
    switch (provider) {
        case 'openai':
        case 'openai-compatible': // For LMStudio/Ollama
            return new OpenAITranslator();
        case 'google':
            return new GoogleAITranslator();
        case 'anthropic':
            return new AnthropicTranslator();
        case 'deepseek':
            return new DeepseekTranslator();
        case 'mistral':
            return new MistralTranslator();
        case 'openrouter':
            return new OpenRouterTranslator();
        case 'azureopenai':
            return new AzureOpenAITranslator();
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}