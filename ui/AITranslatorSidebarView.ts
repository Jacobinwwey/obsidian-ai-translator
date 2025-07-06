
import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import AITranslatorPlugin from '../main';
import { ProgressReporter } from '../types';

export class AITranslatorSidebarView extends ItemView implements ProgressReporter {
    plugin: AITranslatorPlugin;
    private statusEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private progressBarContainerEl: HTMLElement | null = null;
    private logEl: HTMLElement | null = null;
    private logContent: string[] = [];
    private cancelButton: HTMLButtonElement | null = null;
    private isCancelled: boolean = false;
    public abortController: AbortController | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: AITranslatorPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return 'translator-sidebar-view';
    }

    getDisplayText() {
        return 'AI Translator';
    }

    get cancelled() {
        return this.isCancelled;
    }

    requestCancel() {
        if (!this.isCancelled) {
            this.isCancelled = true;
            this.abortController?.abort();
            this.updateStatus('Cancelling...', -1);
            this.log('User requested cancellation.');
            if (this.cancelButton) {
                this.cancelButton.disabled = true;
            }
        }
    }

    clearDisplay() {
        this.isCancelled = false;
        this.abortController = null;
        this.logContent = [];
        if (this.logEl) this.logEl.empty();
        if (this.statusEl) this.statusEl.setText('Ready');
        if (this.progressEl) {
            this.progressEl.dataset.progress = '0';
            this.progressEl.setText('');
            this.progressEl.removeClass('is-error');
        }
        if (this.progressBarContainerEl) this.progressBarContainerEl.addClass('is-hidden');
        if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.removeClass('is-active');
        }
    }

    updateStatus(text: string, percent?: number) {
        if (this.statusEl) this.statusEl.setText(text);
        if (this.cancelButton && this.plugin.getIsBusy()) {
            this.cancelButton.disabled = false;
            this.cancelButton.addClass('is-active');
        } else if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.removeClass('is-active');
        }

        if (percent !== undefined && this.progressEl && this.progressBarContainerEl) {
            this.progressBarContainerEl.removeClass('is-hidden');
            if (percent >= 0) {
                const clampedPercent = Math.min(100, Math.max(0, percent));
                this.progressEl.dataset.progress = String(clampedPercent);
                this.progressEl.setText(`${Math.round(clampedPercent)}%`);
                this.progressEl.removeClass('is-error');
            } else {
                this.progressEl.dataset.progress = '100';
                this.progressEl.addClass('is-error');
                this.progressEl.setText('Cancelled/Error');
            }
        }
    }

    log(message: string) {
        if (this.logEl) {
            const timestamp = `[${new Date().toLocaleTimeString()}]`;
            const fullMessage = `${timestamp} ${message}`;
            this.logContent.push(fullMessage);

            const entry = this.logEl.createEl('div', { cls: 'translator-log-entry' });
            entry.createEl('span', { text: timestamp, cls: 'translator-log-time' });
            entry.createEl('span', { text: ` ${message}`, cls: 'translator-log-message' });
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('translator-sidebar-container');

        container.createEl("h4", { text: "AI Translator" });
        const buttonGroup = container.createDiv({ cls: 'translator-button-group' });

        const translateButton = buttonGroup.createEl('button', { text: 'Translate Active File', cls: 'mod-cta' });
        translateButton.onclick = async () => {
            await this.plugin.translateAndCompareFile();
        };

        container.createEl('hr');
        const progressArea = container.createDiv({ cls: 'translator-progress-area' });
        this.statusEl = progressArea.createEl('p', { text: 'Ready', cls: 'translator-status-text' });
        this.progressBarContainerEl = progressArea.createEl('div', { cls: 'translator-progress-bar-container is-hidden' });
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'translator-progress-bar-fill' });

        this.cancelButton = progressArea.createEl('button', { text: 'Cancel', cls: 'translator-cancel-button' });
        this.cancelButton.onclick = () => {
            this.plugin.cancelTranslation();
        };

        container.createEl('hr');
        const logHeader = container.createDiv({ cls: 'translator-log-header' });
        logHeader.createEl('h5', { text: 'Log' });
        const copyLogButton = logHeader.createEl('button', { text: 'Copy Log', cls: 'translator-copy-log-button' });
        copyLogButton.onclick = () => {
            if (this.logContent.length > 0) {
                navigator.clipboard.writeText(this.logContent.join('\n')).then(() => new Notice('Log copied!'), () => new Notice('Failed to copy log.'));
            } else { new Notice('Log is empty.'); }
        };
        this.logEl = container.createEl('div', { cls: 'translator-log-output is-selectable' });
    }

    async onClose() {
        // Nothing to clean up.
    }
}
