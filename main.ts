import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { createTranslator } from './translators/factory';

interface AITranslatorSettings {
	apiKey: string;
	llmProvider: string;
	outputPath: string;
    model: string;
    temperature: number;
    maxTokens: number;
    customEndpoint: string;
    targetLanguage: string;
}

const DEFAULT_SETTINGS: AITranslatorSettings = {
	apiKey: '',
	llmProvider: 'openai',
	outputPath: 'translations',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    customEndpoint: '',
    targetLanguage: 'English'
}

export default class AITranslatorPlugin extends Plugin {
	settings: AITranslatorSettings;

	async onload() {
		await this.loadSettings();

        // Add a ribbon icon
        this.addRibbonIcon('language', 'Translate Document', () => {
            this.translateAndCompareFile();
        });

		this.addCommand({
			id: 'translate-and-compare-file',
			name: 'Translate and Compare File',
			callback: () => this.translateAndCompareFile()
		});

		this.addSettingTab(new AITranslatorSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    async translateAndCompareFile() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file to translate.');
            return;
        }

        if (!this.settings.apiKey) {
            new Notice('API key is not set. Please configure it in the plugin settings.');
            return;
        }

        new Notice('Translating document...');
        const fileContent = await this.app.vault.read(activeFile);

        try {
            const translator = createTranslator(this.settings.llmProvider);
            const translatedContent = await translator.translate(
                fileContent,
                this.settings.apiKey,
                this.settings.model,
                this.settings.temperature,
                this.settings.maxTokens,
                this.settings.customEndpoint,
                this.settings.targetLanguage
            );
            const newFileName = `${activeFile.basename}.translated.md`;
            const newFilePath = `${this.settings.outputPath}/${newFileName}`;

            try {
                await this.app.vault.createFolder(this.settings.outputPath);
            } catch (e) {
                // Folder already exists
            }

            const newFile = await this.app.vault.create(newFilePath, translatedContent);
            new Notice('Translation complete.');

            // Open original file in the left pane
            const originalLeaf = this.app.workspace.getLeaf('split', 'horizontal');
            await originalLeaf.openFile(activeFile);

            // Open translated file in the right pane
            const translatedLeaf = this.app.workspace.getLeaf('split', 'vertical');
            await translatedLeaf.openFile(newFile);

        } catch (error) {
            console.error('Translation Error:', error);
            new Notice('Error during translation. Check the console for details.');
        }
    }
}

class AITranslatorSettingTab extends PluginSettingTab {
	plugin: AITranslatorPlugin;

	constructor(app: App, plugin: AITranslatorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Your API key for the selected LLM provider.')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		const providerSetting = new Setting(containerEl)
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
                .addOption('openai-compatible', 'OpenAI Compatible (LMStudio/Ollama)')
				.setValue(this.plugin.settings.llmProvider)
				.onChange(async (value) => {
					this.plugin.settings.llmProvider = value;
					await this.plugin.saveSettings();
                    this.display(); // Re-render to show/hide custom endpoint setting
				}));

        const customEndpointSetting = new Setting(containerEl)
            .setName('Custom Endpoint')
            .setDesc('Custom API endpoint for OpenAI Compatible or Azure OpenAI providers.')
            .addText(text => text
                .setPlaceholder('e.g., http://localhost:1234/v1 or your Azure OpenAI endpoint')
                .setValue(this.plugin.settings.customEndpoint)
                .onChange(async (value) => {
                    this.plugin.settings.customEndpoint = value;
                    await this.plugin.saveSettings();
                }));
        
        // Conditionally show custom endpoint setting
        customEndpointSetting.settingEl.toggle(
            this.plugin.settings.llmProvider === 'openai-compatible' ||
            this.plugin.settings.llmProvider === 'azureopenai'
        );

        new Setting(containerEl)
            .setName('Model')
            .setDesc('The model to use for translation.')
            .addText(text => text
                .setPlaceholder('e.g., gpt-4o')
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

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
	}
}