
import { App, Modal, Setting } from 'obsidian';
import { ProgressReporter } from '../types';

export class ProgressModal extends Modal implements ProgressReporter {
    private progressEl: HTMLElement;
    private statusEl: HTMLElement;
    private progressBarContainerEl: HTMLElement;
    private logEl: HTMLElement;
    private cancelButton: HTMLElement;
    private isCancelled = false;
    private startTime: number = 0;
    private timeRemainingEl: HTMLElement;
    private currentAbortController: AbortController | null = null;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('translator-progress-modal');

        new Setting(contentEl).setName('Translating...').setHeading();

        const statusContainer = contentEl.createEl('div', { cls: 'translator-status-container' });
        this.statusEl = statusContainer.createEl('p', { text: 'Starting...', cls: 'translator-status-text' });

        this.progressBarContainerEl = contentEl.createEl('div', { cls: 'translator-progress-bar-container' });
        this.progressBarContainerEl.addClass('is-hidden');
        this.progressEl = this.progressBarContainerEl.createEl('div', { cls: 'translator-progress-bar-fill' });

        this.timeRemainingEl = contentEl.createEl('p', {
            text: 'Estimated time remaining: calculating...',
            cls: 'translator-time-remaining'
        });

        this.logEl = contentEl.createEl('div', { cls: 'translator-log-output' });

        const buttonContainer = contentEl.createEl('div', { cls: 'translator-button-container' });
        this.cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'translator-cancel-button'
        });
        this.cancelButton.onclick = () => this.requestCancel();

        this.startTime = Date.now();
    }

    updateStatus(text: string, percent?: number) {
        if (this.statusEl) this.statusEl.setText(text);
        if (this.progressEl && percent !== undefined && percent >= 0) {
            const clampedPercent = Math.min(100, Math.max(0, percent));
            this.progressEl.dataset.progress = String(clampedPercent);
            this.progressEl.setText(`${Math.round(clampedPercent)}%`);
            this.progressEl.removeClass('is-error');

            if (percent > 0 && this.startTime > 0) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                const estimatedTotal = elapsed / (percent / 100);
                const remaining = Math.max(0, estimatedTotal - elapsed);
                if (this.timeRemainingEl) {
                    this.timeRemainingEl.setText(`Estimated time remaining: ${this.formatTime(remaining)}`);
                }
            } else if (this.timeRemainingEl) {
                this.timeRemainingEl.setText('Estimated time remaining: calculating...');
            }
            if (this.progressBarContainerEl) this.progressBarContainerEl.removeClass('is-hidden');
        } else if (this.progressEl && percent !== undefined && percent < 0) {
            this.progressEl.dataset.progress = '100';
            this.progressEl.addClass('is-error');
            this.progressEl.setText('Cancelled/Error');
            if (this.timeRemainingEl) this.timeRemainingEl.setText('Processing stopped.');
            if (this.progressBarContainerEl) this.progressBarContainerEl.removeClass('is-hidden');
        }
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    log(message: string) {
        if (this.logEl) {
            const entry = this.logEl.createEl('div', { cls: 'translator-log-entry' });
            entry.createEl('span', {
                text: `[${new Date().toLocaleTimeString()}] `,
                cls: 'translator-log-time'
            });
            entry.createEl('span', {
                text: message,
                cls: 'translator-log-message'
            });
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    get cancelled() {
        return this.isCancelled;
    }

    requestCancel() {
        if (!this.isCancelled) {
            this.isCancelled = true;
            this.updateStatus('Cancelling...', -1);
            this.log('User requested cancellation.');
            this.currentAbortController?.abort();
            this.cancelButton?.setAttribute('disabled', 'true');
        }
    }

    clearDisplay() {
        this.logEl?.empty();
        this.updateStatus('Starting...', 0);
        this.isCancelled = false;
        this.currentAbortController = null;
        if (this.cancelButton) this.cancelButton.removeAttribute('disabled');
        if (this.progressBarContainerEl) this.progressBarContainerEl.addClass('is-hidden');
        if (this.timeRemainingEl) this.timeRemainingEl.setText('');
        this.startTime = Date.now();
    }

    get abortController(): AbortController | null | undefined {
        return this.currentAbortController;
    }
    set abortController(controller: AbortController | null | undefined) {
        this.currentAbortController = controller ?? null;
    }
}
