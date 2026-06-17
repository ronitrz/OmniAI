// src/app/features/chat/response-card/response-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { ModelBadgeComponent } from '../../../shared/components/model-badge/model-badge.component';

export interface CardStreamState {
  status: 'idle' | 'streaming' | 'complete' | 'error';
  content: string;
  latencyMs?: number;
  error?: string;
}

@Component({
  selector: 'app-response-card',
  standalone: true,
  imports: [CommonModule, MarkdownPipe, ModelBadgeComponent],
  template: `
    <div 
      class="card response-card glass" 
      [class.streaming]="state.status === 'streaming'"
      [class.error-card]="state.status === 'error'"
    >
      <!-- Card Header -->
      <div class="card-header">
        <div class="model-info">
          <div class="model-avatar" [style.background-color]="color">
            {{ displayName.slice(0, 2).toUpperCase() }}
          </div>
          <div class="model-text">
            <span class="model-name">{{ displayName }}</span>
            <app-model-badge [tier]="tier"></app-model-badge>
          </div>
        </div>

        <div class="metrics">
          <span class="latency" *ngIf="state.status === 'complete' && state.latencyMs">
            {{ (state.latencyMs / 1000).toFixed(1) }}s ⚡
          </span>
          <span class="streaming-dot" *ngIf="state.status === 'streaming'"></span>
        </div>
      </div>

      <!-- Card Content -->
      <div class="card-body">
        <!-- Skeleton Loading while waiting for content -->
        <div class="skeleton-wrapper" *ngIf="state.status === 'idle' || (state.status === 'streaming' && !state.content)">
          <div class="shimmer skeleton-line"></div>
          <div class="shimmer skeleton-line w-4-5"></div>
          <div class="shimmer skeleton-line w-2-3"></div>
        </div>

        <!-- Rendered Markdown Content -->
        <div 
          class="markdown-content" 
          *ngIf="state.content" 
          [innerHTML]="state.content | markdown"
        ></div>

        <!-- Error message -->
        <div class="error-wrapper" *ngIf="state.status === 'error'">
          <span class="error-icon">⚠</span>
          <p class="error-text">{{ state.error || 'Failed to generate response.' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .response-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 250px;
      max-height: 450px;
      padding: 1.25rem;
      border-radius: 14px;
      overflow: hidden;
    }
    .response-card.streaming {
      border-color: rgba(99, 102, 241, 0.25);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.05);
    }
    .response-card.error-card {
      border-color: rgba(239, 68, 68, 0.25);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-light);
      margin-bottom: 1rem;
    }
    .model-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .model-avatar {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
    }
    .model-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .model-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .metrics {
      display: flex;
      align-items: center;
    }
    .latency {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
    }
    .streaming-dot {
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(0.8); opacity: 0.5; }
      to { transform: scale(1.2); opacity: 1; }
    }
    .card-body {
      flex: 1;
      overflow-y: auto;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-top: 0.25rem;
    }
    .skeleton-line {
      height: 14px;
    }
    .w-4-5 { width: 80%; }
    .w-2-3 { width: 66%; }
    .markdown-content ::ng-deep p {
      margin-bottom: 0.75rem;
    }
    .markdown-content ::ng-deep p:last-child {
      margin-bottom: 0;
    }
    .markdown-content ::ng-deep h1,
    .markdown-content ::ng-deep h2,
    .markdown-content ::ng-deep h3 {
      color: var(--text-primary);
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    .markdown-content ::ng-deep ul,
    .markdown-content ::ng-deep ol {
      margin-left: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .error-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--color-error);
      background-color: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 0.5rem;
    }
    .error-icon {
      font-size: 1.25rem;
    }
    .error-text {
      font-size: 0.8125rem;
      font-weight: 500;
    }
  `]
})
export class ResponseCardComponent {
  @Input() displayName: string = '';
  @Input() color: string = '#6366f1';
  @Input() tier: 'live' | 'demo' = 'demo';
  @Input() state: CardStreamState = { status: 'idle', content: '' };
}
