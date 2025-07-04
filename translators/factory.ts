import { Translator } from './index';
import { OpenAITranslator } from './openai';
import { GoogleAITranslator } from './google';
import { AnthropicTranslator } from './anthropic';

export function createTranslator(provider: string): Translator {
    switch (provider) {
        case 'openai':
            return new OpenAITranslator();
        case 'google':
            return new GoogleAITranslator();
        case 'anthropic':
            return new AnthropicTranslator();
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}