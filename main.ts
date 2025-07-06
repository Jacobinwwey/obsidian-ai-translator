import { App, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { createTranslator } from './translators/factory';
import { AITranslatorSettings } from './types';
import { DEFAULT_SETTINGS, TRANSLATOR_SIDEBAR_VIEW_TYPE, TRANSLATOR_SIDEBAR_DISPLAY_TEXT, TRANSLATOR_SIDEBAR_ICON } from './constants';
import { AITranslatorSettingTab } from './ui/AITranslatorSettingTab';
import { AITranslatorSidebarView } from './ui/AITranslatorSidebarView';

export default class AITranslatorPlugin extends Plugin {
    settings: AITranslatorSettings;
    statusBarItem: HTMLElement;
    private isBusy: boolean = false;
    private abortController: AbortController | null = null;

    public getIsBusy(): boolean {
        return this.isBusy;
    }

    public setBusy(busy: boolean) {
        this.isBusy = busy;
    }

    async onload() {
        await this.loadSettings();

        // --- Sidebar View ---
        this.registerView(
            TRANSLATOR_SIDEBAR_VIEW_TYPE,
            (leaf) => new AITranslatorSidebarView(leaf, this)
        );
        const ribbonIconEl = this.addRibbonIcon(TRANSLATOR_SIDEBAR_ICON, TRANSLATOR_SIDEBAR_DISPLAY_TEXT, () => this.activateView());
        ribbonIconEl.addClass('translator-ribbon-class');
        this.addCommand({ id: 'open-translator-sidebar', name: 'Open sidebar', callback: () => this.activateView() });

        // --- Status Bar ---
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar('Ready');

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

    updateStatusBar(text: string) {
        if (this.statusBarItem) {
            this.statusBarItem.setText(`Translator: ${text}`);
        }
    }

    async activateView() {
        const existingLeaves = this.app.workspace.getLeavesOfType(TRANSLATOR_SIDEBAR_VIEW_TYPE);
        if (existingLeaves.length > 0) {
            this.app.workspace.revealLeaf(existingLeaves[0]);
            return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: TRANSLATOR_SIDEBAR_VIEW_TYPE, active: true });
            this.app.workspace.revealLeaf(leaf);
        } else {
            console.error("Could not get right sidebar leaf.");
            new Notice("Could not open Translator sidebar.");
        }
    }

    getSidebarView(): AITranslatorSidebarView | null {
        const leaf = this.app.workspace.getLeavesOfType(TRANSLATOR_SIDEBAR_VIEW_TYPE)[0];
        if (leaf && leaf.view instanceof AITranslatorSidebarView) {
            return leaf.view;
        }
        return null;
    }

    cancelTranslation() {
        if (this.abortController) {
            this.abortController.abort();
            this.isBusy = false;
            this.updateStatusBar('Cancelled');
            this.getSidebarView()?.updateStatus('Cancelled', -1);
        }
    }

    async translateAndCompareFile() {
        if (this.isBusy) {
            new Notice("Translator is busy.");
            return;
        }
        this.isBusy = true;
        this.abortController = new AbortController();
        const sidebar = this.getSidebarView();
        sidebar?.clearDisplay();
        sidebar?.log('Starting translation...');
        this.updateStatusBar('Translating...');

        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                throw new Error('No active file to translate.');
            }

            if (!this.settings.providerSettings[this.settings.llmProvider].apiKey) {
                throw new Error('API key is not set for the selected provider. Please configure it in the plugin settings.');
            }

            sidebar?.updateStatus('Reading file...', 10);
            const fileContent = await this.app.vault.read(activeFile);

            const translator = createTranslator(this.settings.llmProvider);
            const { apiKey, model, customEndpoint } = this.settings.providerSettings[this.settings.llmProvider];
            
            let translatedContent = '';
            let retries = 3;
            for (let i = 0; i < retries; i++) {
                try {
                    sidebar?.updateStatus(`Translating (attempt ${i + 1})...`, 20 + (i * 20));
                    translatedContent = await translator.translate(
                        fileContent,
                        apiKey,
                        model,
                        this.settings.temperature,
                        this.settings.maxTokens,
                        customEndpoint,
                        this.settings.targetLanguage,
                        this.abortController.signal
                    );
                    break; 
                } catch (error) {
                    if (this.abortController.signal.aborted) {
                        throw new Error('Translation cancelled');
                    }
                    if (i === retries - 1) throw error;
                    sidebar?.log(`Translation attempt ${i + 1} failed. Retrying...`);
                    await new Promise(res => setTimeout(res, 2000));
                }
            }

            sidebar?.updateStatus('Creating translated file...', 80);
            const newFileName = `${activeFile.basename}.translated.md`;
            const newFilePath = `${this.settings.outputPath}/${newFileName}`;

            try {
                await this.app.vault.createFolder(this.settings.outputPath);
            } catch (e) {
                // Folder already exists
            }

            const newFile = await this.app.vault.create(newFilePath, translatedContent);
            sidebar?.updateStatus('Opening files...', 90);

            const originalLeaf = this.app.workspace.getLeaf('split', 'horizontal');
            await originalLeaf.openFile(activeFile);

            const translatedLeaf = this.app.workspace.getLeaf('split', 'vertical');
            await translatedLeaf.openFile(newFile);

            sidebar?.updateStatus('Translation complete!', 100);
            new Notice('Translation complete.');

        } catch (error) {
            if (error.message !== 'Translation cancelled') {
                console.error('Translation Error:', error);
                new Notice('Error during translation. Check the console for details.');
                sidebar?.log(`Error: ${error.message}`);
                sidebar?.updateStatus('Error', -1);
            }
        } finally {
            this.isBusy = false;
            this.abortController = null;
            this.updateStatusBar('Ready');
        }
    }
}