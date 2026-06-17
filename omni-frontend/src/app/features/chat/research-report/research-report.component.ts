// src/app/features/chat/research-report/research-report.component.ts
import { Component, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { ModelInfo } from '../model-selector/model-selector.component';
import { CardStreamState } from '../response-card/response-card.component';

@Component({
  selector: 'app-research-report',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  template: `
    <div class="research-report-container glass animate-fade-in">
      <div class="report-header">
        <div class="title-area">
          <span class="report-icon">📄</span>
          <h2 class="report-title">Research Report</h2>
        </div>
        <div class="models-row">
          <span class="meta-label">Analyzed by:</span>
          <div class="models-list">
            <span 
              *ngFor="let model of selectedModels" 
              class="model-chip"
              [style.border-color]="model.color"
              [class.active]="activeModelId() === model.id"
              (click)="activeModelId.set(model.id)"
            >
              <span class="chip-avatar" [style.background-color]="model.color">
                {{ model.displayName.slice(0, 2).toUpperCase() }}
              </span>
              <span class="chip-name">{{ model.displayName }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Report View Body -->
      <div class="report-body">
        <div *ngIf="getActiveState() as state; else noState">
          <!-- Loading state -->
          <div class="skeleton-wrapper" *ngIf="state.status === 'idle' || (state.status === 'streaming' && !state.content)">
            <div class="shimmer skeleton-line h-2rem"></div>
            <div class="shimmer skeleton-line w-4-5"></div>
            <div class="shimmer skeleton-line"></div>
            <div class="shimmer skeleton-line w-2-3"></div>
            <div class="shimmer skeleton-line"></div>
          </div>

          <!-- Document Render -->
          <div 
            class="report-document" 
            *ngIf="state.content"
            [innerHTML]="state.content | markdown"
          ></div>

          <!-- Error Render -->
          <div class="error-wrapper" *ngIf="state.status === 'error'">
            <span class="error-icon">⚠</span>
            <div class="error-content">
              <span class="error-title">Analysis Failed</span>
              <p class="error-text">{{ state.error || 'This provider encountered an error during research.' }}</p>
            </div>
          </div>
        </div>
        <ng-template #noState>
          <p class="empty-report-text">Select a model above to view its structured analysis report.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .research-report-container {
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      overflow: hidden;
      margin-top: 1.5rem;
    }
    .report-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background-color: rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .title-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .report-icon {
      font-size: 1.5rem;
    }
    .report-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .models-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .models-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .model-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem 0.25rem 0.35rem;
      border-radius: 9999px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-light);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .model-chip:hover {
      color: var(--text-primary);
      background-color: var(--bg-tertiary);
    }
    .model-chip.active {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.03);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.02);
    }
    .chip-avatar {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.55rem;
      font-weight: 700;
      color: #fff;
    }
    
    .report-body {
      padding: 2rem;
      background-color: rgba(0, 0, 0, 0.05);
      min-height: 250px;
    }
    .report-document {
      color: var(--text-primary);
      font-size: 1rem;
      line-height: 1.8;
      max-width: 900px;
      margin: 0 auto;
    }
    .report-document ::ng-deep h1,
    .report-document ::ng-deep h2,
    .report-document ::ng-deep h3 {
      color: var(--text-primary);
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 0.35rem;
    }
    .report-document ::ng-deep h2 {
      font-size: 1.25rem;
    }
    .report-document ::ng-deep p {
      margin-bottom: 1.25rem;
    }
    .report-document ::ng-deep ul,
    .report-document ::ng-deep ol {
      margin-left: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .report-document ::ng-deep li {
      margin-bottom: 0.5rem;
    }
    
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .skeleton-line {
      height: 16px;
    }
    .skeleton-line.h-2rem {
      height: 28px;
      margin-bottom: 0.5rem;
    }
    .w-4-5 { width: 80%; }
    .w-2-3 { width: 66%; }
    
    .error-wrapper {
      display: flex;
      gap: 1rem;
      color: var(--color-error);
      background-color: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      padding: 1.5rem;
      border-radius: 12px;
      max-width: 600px;
      margin: 2rem auto;
      align-items: flex-start;
    }
    .error-icon {
      font-size: 1.75rem;
      line-height: 1;
    }
    .error-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .error-title {
      font-weight: 700;
      font-size: 0.9375rem;
    }
    .error-text {
      font-size: 0.875rem;
    }
    .empty-report-text {
      text-align: center;
      color: var(--text-muted);
      padding: 3rem 0;
    }
  `]
})
export class ResearchReportComponent implements OnChanges {
  @Input() selectedModels: ModelInfo[] = [];
  @Input() streamStates: Record<string, CardStreamState> = {};

  activeModelId = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    // Set active model to the first selected model if none is set
    if (changes['selectedModels'] && this.selectedModels.length > 0) {
      const currentActive = this.activeModelId();
      const stillSelected = this.selectedModels.some(m => m.id === currentActive);
      if (!stillSelected) {
        this.activeModelId.set(this.selectedModels[0].id);
      }
    }
  }

  getActiveState(): CardStreamState | null {
    const id = this.activeModelId();
    if (!id) return null;
    return this.streamStates[id] || { status: 'idle', content: '' };
  }
}
