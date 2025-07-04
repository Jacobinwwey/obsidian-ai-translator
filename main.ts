import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createTranslator } from './translators/factory';

interface AITranslatorSettings {
	apiKey: string;
	llmProvider: string;
	outputPath: string;
    model: string;
    temperature: number;
    maxTokens: number;
}

const DEFAULT_SETTINGS: AITranslatorSettings = {
	apiKey: '',
	llmProvider: 'openai',
	outputPath: 'translations',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048
}

export default class AITranslatorPlugin extends Plugin {
	settings: AITranslatorSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'translate-and-compare-file',
			name: 'Translate and Compare File',
			callback: async () => {
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
					const translatedContent = await translator.translate(fileContent, this.settings.apiKey, this.settings.model, this.settings.temperature, this.settings.maxTokens);
					const newFileName = `${activeFile.basename}.translated.md`;
					const newFilePath = `${this.settings.outputPath}/${newFileName}`;

					try {
						await this.app.vault.createFolder(this.settings.outputPath);
					} catch (e) {
						// Folder already exists
					}

					const newFile = await this.app.vault.create(newFilePath, translatedContent);
					new Notice('Translation complete.');

					const leaf = this.app.workspace.getLeaf('split', 'vertical');
					await leaf.openFile(newFile);

				} catch (error) {
					console.error('Translation Error:', error);
					new Notice('Error during translation. Check the console for details.');
				}
			}
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

		new Setting(containerEl)
			.setName('LLM Provider')
			.setDesc('Choose the Large Language Model provider.')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI')
				.addOption('google', 'Google AI')
				.addOption('anthropic', 'Anthropic')
				.setValue(this.plugin.settings.llmProvider)
				.onChange(async (value) => {
					this.plugin.settings.llmProvider = value;
					await this.plugin.saveSettings();
				}));

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