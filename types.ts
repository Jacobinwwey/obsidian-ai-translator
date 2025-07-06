
export interface ProviderSettings {
    apiKey: string;
    model: string;
    customEndpoint: string;
}

export interface AITranslatorSettings {
	llmProvider: string;
	outputPath: string;
    temperature: number;
    maxTokens: number;
    targetLanguage: string;
    providerSettings: {
        [key: string]: ProviderSettings;
    };
}
