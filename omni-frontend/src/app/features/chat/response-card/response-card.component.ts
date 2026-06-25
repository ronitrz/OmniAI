// src/app/features/chat/response-card/response-card.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

export interface CardStreamState {
  status: 'idle' | 'streaming' | 'complete' | 'error';
  content: string;
  latencyMs?: number;
  error?: string;
}

@Component({
  selector: 'app-response-card',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  template: `
    <div 
      class="card response-card" 
      [class.streaming]="state.status === 'streaming'"
      [class.error-card]="state.status === 'error'"
      [class.complete]="state.status === 'complete'"
    >
      <!-- Card Header -->
      <div class="card-header">
        <div class="model-info">
          <div class="model-avatar" [style.background]="getAvatarGradient()">
            <span class="model-logo-icon" *ngIf="modelId === 'gpt-4o'">⁕</span>
            <span class="model-logo-icon" *ngIf="modelId === 'gemini-flash'">✦</span>
            <span class="model-logo-icon" *ngIf="modelId === 'claude-haiku'">▲</span>
            <span class="model-logo-icon" *ngIf="modelId === 'deepseek-chat'">◎</span>
            <span class="model-logo-icon" *ngIf="!modelId">🤖</span>
          </div>
          <div class="model-text">
            <span class="model-name">{{ displayName }}</span>
            <span class="badge-capsule" [class.live]="tier === 'live'" [class.demo]="tier === 'demo'">
              {{ tier | uppercase }}
            </span>
          </div>
        </div>

        <div class="metrics">
          <span class="latency-badge" *ngIf="state.status === 'complete' && state.latencyMs">
            {{ (state.latencyMs / 1000).toFixed(2) }}s ⚡
          </span>
          <span class="status-badge streaming" *ngIf="state.status === 'streaming'">
            <span class="pulsing-dot"></span>
            Streaming
          </span>
          <span class="status-badge thinking" *ngIf="state.status === 'idle'">
            <span class="pulsing-dot amber"></span>
            Thinking
          </span>

          <!-- Copy Button (shows when there is content) -->
          <button 
            class="copy-btn" 
            *ngIf="state.content && (state.status === 'complete' || state.status === 'streaming')" 
            (click)="copyToClipboard()"
            [title]="copied() ? 'Copied!' : 'Copy response'"
            type="button"
          >
            <svg *ngIf="!copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg *ngIf="copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
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

        <!-- Bouncing Dot Typing Indicator when streaming -->
        <div class="typing-indicator" *ngIf="state.status === 'streaming' && state.content">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <!-- Error message -->
        <div class="error-wrapper" *ngIf="state.status === 'error'">
          <span class="error-icon">⚠</span>
          <div class="error-details">
            <span class="error-title">Model Connection Error</span>
            <p class="error-text">{{ state.error || 'Failed to generate response.' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .response-card {
      display: flex;
      flex-direction: column;
      min-height: 200px;
      padding: 1.75rem;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background: var(--bg-tertiary);
      box-shadow: var(--shadow-card);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: visible;
      gap: 1.5rem;
    }
    
    @media (min-width: 768px) {
      .response-card {
        flex-direction: row;
        gap: 2.5rem;
        align-items: stretch;
      }
      
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border-bottom: none !important;
        border-right: 1px solid var(--border-light);
        padding-bottom: 0 !important;
        padding-right: 2.5rem;
        margin-bottom: 0 !important;
        flex: 0 0 220px;
        gap: 1.25rem;
        height: auto;
      }
      
      .metrics {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        gap: 0.75rem;
      }
      
      .copy-btn {
        margin-left: 0 !important;
        margin-top: 0.5rem;
      }
    }
    
    .response-card:hover {
      transform: translateY(-2px);
      border-color: rgba(99, 102, 241, 0.25);
      box-shadow: var(--shadow-card-hover);
    }
    
    .response-card.streaming {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.06);
      background-image: linear-gradient(to bottom, var(--bg-tertiary), rgba(99, 102, 241, 0.005));
    }
    
    .response-card.complete {
      border-color: var(--border-light);
    }
    
    .response-card.error-card {
      border-color: rgba(244, 63, 94, 0.3);
      background-image: linear-gradient(to bottom, var(--bg-tertiary), rgba(244, 63, 94, 0.005));
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-light);
      margin-bottom: 1.25rem;
    }
    
    .model-info {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    
    .model-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #fff;
      font-weight: 700;
      box-shadow: inset 0 1px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .model-logo-icon {
      line-height: 1;
      display: inline-block;
    }
    
    .model-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .model-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    
    .badge-capsule {
      display: inline-flex;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      border: 1px solid transparent;
      width: fit-content;
      letter-spacing: 0.05em;
    }
    
    .badge-capsule.live {
      background-color: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: var(--color-live);
    }
    
    .badge-capsule.demo {
      background-color: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: var(--color-demo);
    }
    
    .metrics {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .latency-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-hover);
      background-color: var(--primary-glow);
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      border: 1px solid var(--border-light);
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      color: var(--text-muted);
    }
    
    .status-badge.streaming {
      color: var(--primary-hover);
      background-color: var(--primary-glow);
      border-color: rgba(99, 102, 241, 0.15);
    }
    
    .pulsing-dot {
      width: 6px;
      height: 6px;
      background-color: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary);
      animation: pulse-glow 1s infinite alternate;
    }
    
    .pulsing-dot.amber {
      background-color: var(--color-demo);
      box-shadow: 0 0 8px var(--color-demo);
    }
    
    @keyframes pulse-glow {
      from { transform: scale(0.85); opacity: 0.5; }
      to { transform: scale(1.15); opacity: 1; }
    }

    .copy-btn {
      background: none;
      border: 1px solid var(--border-light);
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 0.5rem;
    }
    .copy-btn:hover {
      background-color: var(--bg-secondary);
      border-color: var(--border-hover);
      color: var(--text-primary);
    }
    .text-success {
      color: var(--color-success) !important;
    }
    
    .card-body {
      flex: 1;
      overflow: visible;
      font-size: 0.9375rem;
      line-height: 1.75;
      color: var(--text-secondary);
    }
    
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding-top: 0.5rem;
    }
    
    .skeleton-line {
      height: 14px;
    }
    .w-4-5 { width: 80%; }
    .w-2-3 { width: 66%; }
    
    .markdown-content ::ng-deep p {
      margin-bottom: 1rem;
    }
    .markdown-content ::ng-deep p:last-child {
      margin-bottom: 0;
    }
    .markdown-content ::ng-deep h1,
    .markdown-content ::ng-deep h2,
    .markdown-content ::ng-deep h3 {
      color: var(--text-primary);
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.0625rem;
      font-weight: 700;
    }
    .markdown-content ::ng-deep ul,
    .markdown-content ::ng-deep ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .markdown-content ::ng-deep li {
      margin-bottom: 0.45rem;
    }
    
    .markdown-content ::ng-deep code {
      background-color: rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-light);
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.8125rem;
    }
    .light-theme .markdown-content ::ng-deep code {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    /* Bouncing dot indicator */
    .typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0;
      margin-top: 0.5rem;
    }
    .typing-indicator span {
      width: 6px;
      height: 6px;
      background-color: var(--text-dim);
      border-radius: 50%;
      opacity: 0.4;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); opacity: 0.9; }
    }
    
    .error-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      color: var(--color-error);
      background-color: rgba(244, 63, 94, 0.04);
      border: 1px solid rgba(244, 63, 94, 0.1);
      padding: 1rem;
      border-radius: 12px;
      margin-top: 0.75rem;
    }
    .error-icon {
      font-size: 1.5rem;
      line-height: 1;
    }
    .error-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .error-title {
      font-weight: 700;
      font-size: 0.875rem;
    }
    .error-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `]
})
export class ResponseCardComponent {
  @Input() modelId: string = '';
  @Input() displayName: string = '';
  @Input() color: string = '#6366f1';
  @Input() tier: 'live' | 'demo' = 'demo';
  @Input() state: CardStreamState = { status: 'idle', content: '' };

  copied = signal(false);

  copyToClipboard(): void {
    if (!this.state.content) return;
    navigator.clipboard.writeText(this.state.content).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  getAvatarGradient(): string {
    if (this.modelId === 'gpt-4o') {
      return 'linear-gradient(135deg, #10a37f 0%, #15803d 100%)';
    }
    if (this.modelId === 'gemini-flash') {
      return 'linear-gradient(135deg, #4285f4 0%, #7c3aed 100%)';
    }
    if (this.modelId === 'claude-haiku') {
      return 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    }
    if (this.modelId === 'deepseek-chat') {
      return 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)';
    }
    return `linear-gradient(135deg, ${this.color} 0%, #000 100%)`;
  }
}
