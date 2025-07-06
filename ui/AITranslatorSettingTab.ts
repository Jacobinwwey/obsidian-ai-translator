import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import AITranslatorPlugin from '../main';
import { testAPI } from '../llmUtils';
import { DEFAULT_SETTINGS } from '../constants';

export class AITranslatorSettingTab extends PluginSettingTab {
	plugin: AITranslatorPlugin;

	constructor(app: App, plugin: AITranslatorPlugin) {
		super(app, plugin);

		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl).setName('LLM Provider').setHeading();

		new Setting(containerEl)
			.setName('LLM Provider')
			.setDesc('Choose the Large Language Model provider.')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI')
				.addOption('google', 'Google AI')
				.addOption('anthropic', 'Anthropic')
                .addOption('deepseek', 'Deepseek')
                .addOption('mistral', 'Mistral')
                .addOption('openrouter', 'OpenRouter')
                .addOption('azureopenai', 'Azure OpenAI')
                .addOption('ollama', 'Ollama')
                .addOption('lmstudio', 'LMStudio')
				.setValue(this.plugin.settings.llmProvider)
				.onChange(async (value) => {
					this.plugin.settings.llmProvider = value;
					await this.plugin.saveSettings();
                    this.display();
				}));

        const activeProvider = this.plugin.settings.providerSettings[this.plugin.settings.llmProvider];

        if (activeProvider) {
            new Setting(containerEl).setName(`${this.plugin.settings.llmProvider} details`).setHeading();

            new Setting(containerEl)
                .setName('API Key')
                .setDesc(`Your API key for the selected LLM provider. Note: API keys are provider-specific.`)
                .addText(text => text
                    .setPlaceholder('Enter your API key')
                    .setValue(activeProvider.apiKey || '')
                    .onChange(async (value) => {
                        activeProvider.apiKey = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Custom Endpoint')
                .setDesc('Custom API endpoint for the selected provider.')
                .addText(text => text
                    .setPlaceholder('e.g., http://localhost:1234/v1 or your Azure OpenAI endpoint')
                    .setValue(activeProvider.customEndpoint || '')
                    .onChange(async (value) => {
                        activeProvider.customEndpoint = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Model')
                .setDesc('The model to use for translation.')
                .addText(text => text
                    .setPlaceholder('e.g., gpt-4o')
                    .setValue(activeProvider.model || '')
                    .onChange(async (value) => {
                        activeProvider.model = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(`Test ${this.plugin.settings.llmProvider} connection`)
                .setDesc('Verify API key, endpoint, and model accessibility.')
                .addButton(button => button
                    .setButtonText('Test connection').setCta()
                    .onClick(async () => {
                        button.setDisabled(true).setButtonText('Testing...');
                        const testingNotice = new Notice(`Testing connection to ${this.plugin.settings.llmProvider}...`, 0);
                        try {
                            const result = await testAPI(this.plugin.settings.llmProvider, activeProvider);
                            testingNotice.hide();
                            if (result.success) { new Notice(`✅ Success: ${result.message}`, 5000); }
                            else { new Notice(`❌ Failed: ${result.message}. Check console.`, 10000); }
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            testingNotice.hide();
                            new Notice(`Error during connection test: ${message}`, 10000);
                            console.error(`Error testing ${this.plugin.settings.llmProvider} connection from settings:`, error);
                        } finally {
                            button.setDisabled(false).setButtonText('Test connection');
                        }
                    }));
        }

		new Setting(containerEl).setName('Translation Settings').setHeading();

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness. Higher values make the output more random.')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.temperature)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('The maximum number of tokens to generate.')
            .addText(text => text
                .setPlaceholder('e.g., 2048')
                .setValue(this.plugin.settings.maxTokens.toString())
                .onChange(async (value) => {
                    this.plugin.settings.maxTokens = parseInt(value);
                    await this.plugin.saveSettings();
                }));
		
		new Setting(containerEl)
            .setName('Target Language')
            .setDesc('The language to translate the document into.')
            .addDropdown(dropdown => {
                const COMMON_LANGUAGES = {
                    'English': 'English',
                    'Spanish': 'Español',
                    'French': 'Français',
                    'German': 'Deutsch',
                    'Chinese': '中文',
                    'Japanese': '日本語',
                    'Korean': '한국어',
                    'Russian': 'Русский',
                    'Portuguese': 'Português',
                    'Italian': 'Italiano',
                    'Arabic': 'العربية',
                    'Hindi': 'हिन्दी',
                    'Bengali': 'বাংলা',
                    'Dutch': 'Nederlands',
                    'Turkish': 'Türkçe',
                    'Vietnamese': 'Tiếng Việt',
                    'Polish': 'Polski',
                    'Thai': 'ไทย',
                    'Swedish': 'Svenska',
                    'Indonesian': 'Bahasa Indonesia'
                };
                for (const langKey in COMMON_LANGUAGES) {
                    dropdown.addOption(langKey as keyof typeof COMMON_LANGUAGES, COMMON_LANGUAGES[langKey as keyof typeof COMMON_LANGUAGES]);
                }
                dropdown
                    .setValue(this.plugin.settings.targetLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.targetLanguage = value;
                        await this.plugin.saveSettings();
                    });
            });

		new Setting(containerEl)
			.setName('Output Path')
			.setDesc('Path to save translated files.')
			.addText(text => text
				.setPlaceholder('e.g., translations/')
				.setValue(this.plugin.settings.outputPath)
				.onChange(async (value) => {
					this.plugin.settings.outputPath = value;
					await this.plugin.saveSettings();
				}));

        new Setting(containerEl).setName('Stable API calls').setHeading();
        new Setting(containerEl)
            .setName('Enable stable API calls (retry logic)')
            .setDesc('On: Automatically retry failed LLM API calls. Off: Fail on first error.')
            .addToggle(toggle => toggle.setValue(this.plugin.settings.enableStableApiCall).onChange(async (value) => { this.plugin.settings.enableStableApiCall = value; await this.plugin.saveSettings(); this.display(); }));
        if (this.plugin.settings.enableStableApiCall) {
            new Setting(containerEl).setName('Retry interval (seconds)').setDesc('Wait time between retries.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallInterval)).setValue(String(this.plugin.settings.apiCallInterval)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 1 && num <= 300) { this.plugin.settings.apiCallInterval = num; } else { this.plugin.settings.apiCallInterval = DEFAULT_SETTINGS.apiCallInterval; } await this.plugin.saveSettings(); this.display(); }));
            new Setting(containerEl).setName('Maximum retries').setDesc('Max retry attempts.').addText(text => text.setPlaceholder(String(DEFAULT_SETTINGS.apiCallMaxRetries)).setValue(String(this.plugin.settings.apiCallMaxRetries)).onChange(async (value) => { const num = parseInt(value, 10); if (!isNaN(num) && num >= 0 && num <= 10) { this.plugin.settings.apiCallMaxRetries = num; } else { this.plugin.settings.apiCallMaxRetries = DEFAULT_SETTINGS.apiCallMaxRetries; } await this.plugin.saveSettings(); this.display(); }));
        }
	}
}
