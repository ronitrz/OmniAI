// src/app/features/chat/model-selector/model-selector.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelBadgeComponent } from '../../../shared/components/model-badge/model-badge.component';

export interface ModelInfo {
  id: string;
  displayName: string;
  fullName: string;
  provider: string;
  tier: 'live' | 'demo';
  description: string;
  strengths: string[];
  color: string;
}

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, ModelBadgeComponent],
  template: `
    <div class="selector-container">
      <div class="selector-header">
        <span class="title">SELECT AI MODELS</span>
        <span class="count">{{ selectedIds.size }} / 4 selected</span>
      </div>

      <div class="models-grid">
        <div
          *ngFor="let model of models"
          class="model-card glass"
          [class.selected]="selectedIds.has(model.id)"
          (click)="toggleSelection(model.id)"
          [style.border-color]="selectedIds.has(model.id) ? model.color : ''"
        >
          <div class="model-meta">
            <div class="model-avatar" [style.background-color]="model.color">
              {{ model.displayName.slice(0, 2).toUpperCase() }}
            </div>
            <div class="model-details">
              <span class="model-name">{{ model.displayName }}</span>
              <span class="model-fullname">{{ model.fullName }}</span>
            </div>
            <app-model-badge [tier]="model.tier"></app-model-badge>
          </div>
          <p class="model-description">{{ model.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .selector-container {
      margin-bottom: 1.5rem;
    }
    .selector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0 0.25rem;
    }
    .title {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .model-card {
      padding: 1rem;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }
    .model-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background-color: var(--bg-tertiary);
    }
    .model-card.selected {
      background-color: rgba(255, 255, 255, 0.03);
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.02);
    }
    .model-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
    }
    .model-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fff;
    }
    .model-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .model-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .model-fullname {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .model-description {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class ModelSelectorComponent {
  @Input() models: ModelInfo[] = [];
  @Input() selectedIds = new Set<string>();
  @Output() selectionChanged = new EventEmitter<Set<string>>();

  toggleSelection(id: string): void {
    const updated = new Set<string>(this.selectedIds);
    if (updated.has(id)) {
      if (updated.size > 1) { // Ensure at least 1 model is selected
        updated.delete(id);
      }
    } else {
      if (updated.size < 4) {
        updated.add(id);
      }
    }
    this.selectionChanged.emit(updated);
  }
}
