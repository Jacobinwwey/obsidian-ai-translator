import { TranslationProvider, AITranslatorSettings, ProgressReporter } from '../types';
import { executeLMStudioApi, callApiWithRetry } from '../llmUtils';

export class LMStudioTranslator implements TranslationProvider {
    name = 'lmstudio';

    async translate(text: string, targetLanguage: string, settings: AITranslatorSettings, progressReporter: ProgressReporter): Promise<string> {
        const providerConfig = settings.providerSettings[this.name];
        const prompt = `Translate the following markdown document to ${targetLanguage}. It is crucial to preserve ALL markdown formatting, including headings, lists, code blocks, tables, links, and especially image links and their layout. Do NOT add any extra text, comments, or explanations. Only provide the translated content.`;
        
        return callApiWithRetry(
            this.name,
            providerConfig,
            prompt,
            text,
            settings,
            progressReporter,
            (config, p, c, signal, s) => executeLMStudioApi(config, p, c, signal, s, progressReporter)
        );
    }
}