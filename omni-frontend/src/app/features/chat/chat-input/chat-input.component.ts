// src/app/features/chat/chat-input/chat-input.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelSelectorComponent, ModelInfo } from '../model-selector/model-selector.component';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelSelectorComponent],
  template: `
    <div class="chat-input-wrapper glass">
      <!-- Model Selector Toggle & Model Selector component -->
      <div class="selector-toggle-area">
        <button 
          type="button" 
          class="btn-toggle" 
          (click)="showSelector.set(!showSelector())"
        >
          <span>⚙️ Model Selection ({{ selectedIds.size }} active)</span>
          <span>{{ showSelector() ? '▲ Hide' : '▼ Show' }}</span>
        </button>
      </div>

      <div class="selector-panel" *ngIf="showSelector()">
        <app-model-selector
          [models]="models"
          [selectedIds]="selectedIds"
          (selectionChanged)="onModelSelectionChange($event)"
        ></app-model-selector>
      </div>

      <!-- Main Input Textarea and Actions -->
      <form (ngSubmit)="onSubmit()" class="input-form">
        <div class="input-row">
          <textarea
            name="prompt"
            class="textarea-input"
            [(ngModel)]="promptText"
            (keydown.enter)="onEnterKey($event)"
            [disabled]="disabled"
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows="2"
            #textareaRef
            (input)="adjustHeight(textareaRef)"
          ></textarea>
        </div>

        <div class="actions-row">
          <!-- Mode Toggle -->
          <div class="mode-selector">
            <button
              type="button"
              class="mode-btn"
              [class.active]="mode === 'standard'"
              (click)="setMode('standard')"
            >
              Standard
            </button>
            <button
              type="button"
              class="mode-btn"
              [class.active]="mode === 'research'"
              (click)="setMode('research')"
            >
              Research
            </button>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary send-btn"
            [disabled]="disabled || !promptText.trim() || selectedIds.size === 0"
          >
            <span class="send-icon">➔</span>
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .chat-input-wrapper {
      padding: 1.25rem;
      border-radius: 16px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
    }
    .selector-toggle-area {
      margin-bottom: 0.75rem;
    }
    .btn-toggle {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s;
    }
    .btn-toggle:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }
    .selector-panel {
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 1rem;
    }
    .input-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .textarea-input {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.9375rem;
      resize: none;
      outline: none;
      line-height: 1.5;
    }
    .textarea-input::placeholder {
      color: var(--text-muted);
    }
    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-light);
      padding-top: 0.75rem;
    }
    .mode-selector {
      display: flex;
      background-color: var(--bg-primary);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
    .mode-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mode-btn.active {
      background-color: var(--bg-tertiary);
      color: var(--primary);
    }
    .send-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
    }
    .send-icon {
      font-size: 0.875rem;
    }
  `]
})
export class ChatInputComponent {
  @Input() models: ModelInfo[] = [];
  @Input() selectedIds = new Set<string>();
  @Input() mode: 'standard' | 'research' = 'standard';
  @Input() disabled: boolean = false;

  @Output() sendMessage = new EventEmitter<{ content: string; selectedModels: string[]; mode: 'standard' | 'research' }>();
  @Output() modelSelectionChanged = new EventEmitter<Set<string>>();
  @Output() modeChanged = new EventEmitter<'standard' | 'research'>();

  promptText = '';
  showSelector = signal(false);

  adjustHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onEnterKey(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.key === 'Enter' && !kbEvent.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onModelSelectionChange(updated: Set<string>): void {
    this.modelSelectionChanged.emit(updated);
  }

  setMode(updatedMode: 'standard' | 'research'): void {
    this.modeChanged.emit(updatedMode);
  }

  onSubmit(): void {
    if (this.disabled || !this.promptText.trim() || this.selectedIds.size === 0) return;

    this.sendMessage.emit({
      content: this.promptText.trim(),
      selectedModels: Array.from(this.selectedIds),
      mode: this.mode
    });

    this.promptText = '';
  }
}
