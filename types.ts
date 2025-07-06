export interface ProviderSettings {
    name: string;
    apiKey: string;
    model: string;
    customEndpoint: string;
    temperature: number;
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
    enableStableApiCall: boolean;
    apiCallInterval: number;
    apiCallMaxRetries: number;
}

export interface ProgressReporter {
    log(message: string): void;
    updateStatus(text: string, percent?: number): void;
    get cancelled(): boolean;
    requestCancel(): void;
    clearDisplay(): void;
    abortController?: AbortController | null;
}

export interface TranslationProvider {
    name: string;
    translate(
        text: string,
        targetLanguage: string,
        settings: AITranslatorSettings,
        progressReporter: ProgressReporter
    ): Promise<string>;
}