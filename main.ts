import { App, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { createTranslator } from './translators/factory';
import { AITranslatorSettings, ProgressReporter } from './types';
import { DEFAULT_SETTINGS, TRANSLATOR_SIDEBAR_VIEW_TYPE, TRANSLATOR_SIDEBAR_DISPLAY_TEXT, TRANSLATOR_SIDEBAR_ICON } from './constants';
import { AITranslatorSettingTab } from './ui/AITranslatorSettingTab';
import { AITranslatorSidebarView } from './ui/AITranslatorSidebarView';
import { ProgressModal } from './ui/ProgressModal';

export default class AITranslatorPlugin extends Plugin {
    settings: AITranslatorSettings;
    statusBarItem: HTMLElement;
    private isBusy: boolean = false;
    private currentReporter: ProgressReporter | null = null;

    public getIsBusy(): boolean {
        return this.isBusy;
    }

    public setBusy(busy: boolean) {
        this.isBusy = busy;
    }

    async onload() {
        await this.loadSettings();

        this.registerView(
            TRANSLATOR_SIDEBAR_VIEW_TYPE,
            (leaf) => new AITranslatorSidebarView(leaf, this)
        );
        const ribbonIconEl = this.addRibbonIcon(TRANSLATOR_SIDEBAR_ICON, TRANSLATOR_SIDEBAR_DISPLAY_TEXT, () => this.activateView());
        ribbonIconEl.addClass('translator-ribbon-class');
        this.addCommand({ id: 'open-translator-sidebar', name: 'Open sidebar', callback: () => this.activateView() });

        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar('Ready');

        this.addCommand({
            id: 'translate-and-compare-file',
            name: 'Translate and Compare File',
            callback: () => this.translateAndCompareFile()
        });

        this.addSettingTab(new AITranslatorSettingTab(this.app, this));
    }

    onunload() {}

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

    getReporter(): ProgressReporter {
        const view = this.app.workspace.getLeavesOfType(TRANSLATOR_SIDEBAR_VIEW_TYPE)[0]?.view;
        if (view instanceof AITranslatorSidebarView) {
            this.app.workspace.revealLeaf(view.leaf);
            view.clearDisplay();
            this.currentReporter = view;
            return view;
        } else {
            const modal = new ProgressModal(this.app);
            modal.open();
            this.currentReporter = modal;
            return modal;
        }
    }

    cancelTranslation() {
        if (this.currentReporter) {
            this.currentReporter.requestCancel();
        }
    }

    async translateAndCompareFile() {
        if (this.isBusy) {
            new Notice("Translator is busy.");
            return;
        }
        this.isBusy = true;
        const useReporter = this.getReporter();
        useReporter.clearDisplay();
        this.updateStatusBar('Translating...');

        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                throw new Error('No active file to translate.');
            }

            const providerConfig = this.settings.providerSettings[this.settings.llmProvider];
            if (!providerConfig || !providerConfig.apiKey) {
                throw new Error('API key is not set for the selected provider. Please configure it in the plugin settings.');
            }

            useReporter.updateStatus('Reading file...', 10);
            const fileContent = await this.app.vault.read(activeFile);

            const translator = createTranslator(this.settings.llmProvider);
            
            useReporter.updateStatus(`Translating with ${this.settings.llmProvider}...`, 20);
            const translatedContent = await translator.translate(
                fileContent,
                this.settings.targetLanguage,
                this.settings,
                useReporter
            );

            if (useReporter.cancelled) {
                throw new Error("Translation cancelled by user.");
            }

            useReporter.updateStatus('Creating translated file...', 80);
            const newFileName = `${activeFile.basename}.translated.md`;
            const newFilePath = `${this.settings.outputPath}/${newFileName}`;

            try {
                await this.app.vault.createFolder(this.settings.outputPath);
            } catch (e) {
                // Folder already exists
            }

            const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
            if (existingFile && existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, translatedContent);
            } else {
                await this.app.vault.create(newFilePath, translatedContent);
            }
            
            const newFile = this.app.vault.getAbstractFileByPath(newFilePath) as TFile;

            useReporter.updateStatus('Opening files...', 90);

            const translatedLeaf = this.app.workspace.getLeaf('split', 'vertical');
            await translatedLeaf.openFile(newFile);

            useReporter.updateStatus('Translation complete!', 100);
            new Notice('Translation complete.');
            if (useReporter instanceof ProgressModal) setTimeout(() => useReporter.close(), 2000);

        } catch (error) {
            const message = error.message || "Unknown error";
            if (useReporter.cancelled) {
                useReporter.log('Translation cancelled by user.');
                useReporter.updateStatus('Cancelled', -1);
            } else {
                console.error('Translation Error:', error);
                new Notice('Error during translation. Check the console for details.');
                useReporter.log(`Error: ${message}`);
                useReporter.updateStatus('Error', -1);
            }
        } finally {
            this.isBusy = false;
            this.currentReporter = null;
            this.updateStatusBar('Ready');
        }
    }
}