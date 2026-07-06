// src/app/features/chat/jury-verdict/jury-verdict.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuryVerdict } from '../../../shared/models/verdict.model';
import { ModelInfo } from '../model-selector/model-selector.component';
import { ConfidenceGaugeComponent } from '../../../shared/components/confidence-gauge/confidence-gauge.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-jury-verdict',
  standalone: true,
  imports: [CommonModule, ConfidenceGaugeComponent, MarkdownPipe],
  template: `
    <div class="verdict-card" *ngIf="verdict">
      <div class="verdict-header">
        <div class="header-main">
          <h2 class="title">Jury Verdict</h2>
        </div>
        <span class="badge" [ngClass]="verdict.confidenceLabel.toLowerCase()">
          {{ verdict.confidenceLabel }} Consensus
        </span>
      </div>

      <div class="verdict-layout">
        <!-- Confidence Gauge -->
        <div class="gauge-section">
          <app-confidence-gauge
            [score]="verdict.confidenceScore"
            [label]="verdict.confidenceLabel"
          ></app-confidence-gauge>
        </div>

        <!-- Consensus Summary -->
        <div class="consensus-section">
          <!-- Metric counters grid -->
          <div class="metrics-summary-grid">
            <div class="metric-card glass">
              <div class="m-details">
                <span class="m-val">{{ verdict.agreements.length }}</span>
                <span class="m-label">Agreements</span>
              </div>
            </div>
            <div class="metric-card glass">
              <div class="m-details">
                <span class="m-val">{{ verdict.contradictions.length }}</span>
                <span class="m-label">Contradictions</span>
              </div>
            </div>
            <div class="metric-card glass">
              <div class="m-details">
                <span class="m-val">{{ verdict.uniqueInsights.length }}</span>
                <span class="m-label">Unique Insights</span>
              </div>
            </div>
          </div>

          <p class="summary-text" *ngIf="!verdict.consensusText">No consensus text available.</p>
          
          <div class="recommendation-card" *ngIf="verdict.recommendation">
            <div class="recommendation-badge">ACTIONABLE RECOMMENDATION</div>
            <p class="recommendation-text">{{ verdict.recommendation }}</p>
          </div>
        </div>
      </div>

      <!-- Verdict Analysis Tabs -->
      <div class="analysis-tabs-container">
        <div class="tabs-header">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'answer'"
            (click)="activeTab.set('answer')"
          >
            Consensus Answer
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'contradictions'"
            (click)="activeTab.set('contradictions')"
          >
            Contradictions
            <span class="tab-badge">{{ verdict.contradictions.length }}</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'insights'"
            (click)="activeTab.set('insights')"
          >
            Unique Insights
            <span class="tab-badge">{{ verdict.uniqueInsights.length }}</span>
          </button>
        </div>

        <div class="tab-body">
          <!-- Consensus Answer Tab -->
          <div *ngIf="activeTab() === 'answer'" class="consensus-answer-body">
            <div class="consensus-answer-header">
              <span class="consensus-model-count">Synthesized from {{ modelsInfo.length || 'all' }} AI models</span>
            </div>
            <div class="markdown-content" [innerHTML]="verdict.consensusText | markdown"></div>
          </div>

          <!-- Contradictions Tab -->
          <div *ngIf="activeTab() === 'contradictions'">
            <div class="tab-explanation animate-fade-in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="explanation-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Discrepancies found where models asserted conflicting facts or positions.</span>
            </div>
            <div class="contradictions-list" *ngIf="verdict.contradictions.length > 0; else noContradictions">
              <div *ngFor="let item of verdict.contradictions" class="contradiction-item">
                <h4 class="contradiction-topic">{{ item.topic }}</h4>
                <div class="positions-grid">
                  <div *ngFor="let pos of getPositionsArray(item.positions)" class="position-card">
                    <!-- Colored border accent matching the model -->
                    <div class="model-accent-bar" [style.background-color]="getModelColor(pos.modelId)"></div>
                    <span class="model-label" [style.color]="getModelColor(pos.modelId)">
                      {{ getModelDisplayName(pos.modelId) }}
                    </span>
                    <p class="position-text">"{{ pos.position }}"</p>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noContradictions>
              <p class="empty-tab-text">No significant contradictions were found between the models.</p>
            </ng-template>
          </div>

          <!-- Unique Insights Tab -->
          <div *ngIf="activeTab() === 'insights'">
            <div class="tab-explanation animate-fade-in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="explanation-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Specialized facts, unique context, or domain details mentioned by exactly one model that others did not raise.</span>
            </div>
            <ul class="analysis-list" *ngIf="verdict.uniqueInsights.length > 0; else noInsights">
              <li *ngFor="let item of verdict.uniqueInsights" class="analysis-item">
                <span 
                  class="item-icon model-dot" 
                  [style.background-color]="getModelColor(item.modelId)"
                  [style.box-shadow]="'0 0 8px ' + getModelColor(item.modelId)"
                ></span>
                <div class="insight-content">
                  <span class="model-label" [style.color]="getModelColor(item.modelId)">
                    {{ getModelDisplayName(item.modelId) }}:
                  </span>
                  <p class="item-text font-italic">"{{ item.insight }}"</p>
                </div>
              </li>
            </ul>
            <ng-template #noInsights>
              <p class="empty-tab-text">No model-specific unique insights were highlighted.</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verdict-card {
      padding: 1.75rem;
      border-radius: 16px;
      margin-top: 2.5rem;
      border: 1px solid var(--border-light) !important;
      background: var(--bg-tertiary) !important;
      color: var(--text-secondary) !important;
      box-shadow: var(--shadow-card);
      animation: fadeIn 0.4s ease-out forwards;
    }
    
    .verdict-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .header-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .scale-icon {
      font-size: 1.5rem;
      line-height: 1;
      display: inline-block;
      animation: balance-scale 4s ease-in-out infinite alternate;
    }
    
    @keyframes balance-scale {
      0% { transform: rotate(-5deg); }
      100% { transform: rotate(5deg); }
    }
    
    .title {
      font-size: 1.125rem;
      font-weight: 750;
      color: var(--text-primary) !important;
      letter-spacing: -0.01em;
    }
    
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.875rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .badge.high {
      background-color: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-live);
    }
    
    .badge.medium {
      background-color: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: var(--color-demo);
    }
    
    .badge.low {
      background-color: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: var(--color-error);
    }
    
    .verdict-layout {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem 2.5rem;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 800px) {
      .verdict-layout {
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }
    }
    
    .gauge-section {
      flex-shrink: 0;
      background: var(--bg-tertiary) !important;
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid var(--border-light);
    }
    
    .consensus-section {
      flex: 1 1 300px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      min-width: 0;
    }
    
    /* Metrics counters grid */
    .metrics-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }
    
    .metric-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      background: var(--bg-tertiary) !important;
      border: 1px solid var(--border-light) !important;
      box-shadow: none !important;
    }
    
    .m-icon {
      font-size: 1.5rem;
      line-height: 1;
    }
    
    .m-details {
      display: flex;
      flex-direction: column;
    }
    
    .m-val {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      line-height: 1.1;
    }
    
    .m-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted) !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .summary-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--text-secondary) !important;
    }
    
    .recommendation-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 2 purple, 0.01) 100%) !important;
      border: 1px dashed rgba(99, 102, 241, 0.25) !important;
      padding: 1.25rem;
      border-radius: 12px;
      position: relative;
    }
    
    .recommendation-badge {
      font-size: 0.6875rem;
      font-weight: 800;
      color: var(--primary-hover);
      letter-spacing: 0.08em;
    }
    
    .recommendation-text {
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.5;
      color: var(--text-primary) !important;
    }
    
    /* Tabs selector layout */
    .analysis-tabs-container {
      border: 1px solid var(--border-light);
      border-radius: 16px;
      overflow: hidden;
      background-color: var(--bg-tertiary) !important;
      margin-top: 2rem;
    }
    
    .tabs-header {
      display: flex;
      flex-wrap: wrap;
      background-color: var(--bg-secondary) !important;
      border-bottom: 1px solid var(--border-light);
      padding: 0.35rem;
      gap: 0.35rem;
    }
    
    @media (max-width: 600px) {
      .tabs-header {
        flex-direction: column;
      }
    }
    
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-muted) !important;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
    }
    
    .tab-btn:hover {
      color: var(--text-primary) !important;
      background-color: var(--bg-tab-active);
    }
    
    .tab-btn.active {
      color: #ffffff !important;
      background-color: var(--primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
    
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-tab-badge);
      border-radius: 9999px;
      min-width: 20px;
      height: 20px;
      padding: 0 0.35rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: inherit;
    }
    
    .tab-btn.active .tab-badge {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .tab-body {
      padding: 1.75rem;
      min-height: 140px;
    }
    
    .analysis-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    
    .analysis-item {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
    }
    
    .item-icon.check {
      color: var(--color-live);
      font-weight: 800;
      font-size: 1.125rem;
      line-height: 1.2;
    }
    
    .item-icon.model-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.5rem;
      flex-shrink: 0;
    }
    
    .item-text {
      font-size: 0.875rem;
      color: var(--text-secondary) !important;
      line-height: 1.5;
    }
    
    .font-italic {
      font-style: italic;
    }
    
    .insight-content {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .model-label {
      font-size: 0.8125rem;
      font-weight: 700;
      white-space: nowrap;
    }
    
    /* Contradictions styling */
    .contradictions-list {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    
    .contradiction-item {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    
    .contradiction-topic {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary) !important;
    }
    
    .positions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    
    .position-card {
      background-color: var(--bg-tertiary) !important;
      border: 1px solid var(--border-light) !important;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s;
      position: relative;
      padding-left: 1.25rem;
    }
    
    .position-card:hover {
      background-color: var(--bg-secondary) !important;
      border-color: var(--border-hover) !important;
    }
    
    .model-accent-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
    }
    
    .position-text {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--text-secondary) !important;
      font-style: italic;
    }
    
    .empty-tab-text {
      font-size: 0.875rem;
      color: var(--text-dim) !important;
      text-align: center;
      padding: 2rem 0;
    }

    /* Consensus Answer tab */
    .consensus-answer-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .consensus-answer-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 0.875rem;
      border-bottom: 1px solid var(--border-light);
    }

    .consensus-model-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted) !important;
      background: var(--primary-glow);
      padding: 0.2rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    /* Markdown rendering inside jury verdict */
    .markdown-content ::ng-deep p { margin-bottom: 0.875rem; line-height: 1.75; color: var(--text-secondary) !important; }
    .markdown-content ::ng-deep p:last-child { margin-bottom: 0; }
    .markdown-content ::ng-deep h2 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary) !important;
      margin-top: 1.5rem;
      margin-bottom: 0.625rem;
      letter-spacing: -0.01em;
    }
    .markdown-content ::ng-deep h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary) !important;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    .markdown-content ::ng-deep strong { color: var(--text-primary) !important; font-weight: 700; }
    .markdown-content ::ng-deep ul, .markdown-content ::ng-deep ol {
      margin-left: 1.5rem;
      margin-bottom: 0.875rem;
      color: var(--text-secondary) !important;
    }
    .markdown-content ::ng-deep li { margin-bottom: 0.35rem; line-height: 1.6; }
    .markdown-content ::ng-deep code {
      background-color: rgba(0,0,0,0.06);
      border: 1px solid var(--border-light);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .tab-explanation {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      background-color: var(--primary-glow);
      border: 1px solid var(--border-light);
      border-radius: 10px;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.45;
    }
    
    .explanation-icon {
      width: 14px;
      height: 14px;
      color: var(--primary-hover);
      flex-shrink: 0;
    }
  `]

})
export class JuryVerdictComponent {
  @Input() verdict: JuryVerdict | null = null;
  @Input() modelsInfo: ModelInfo[] = [];

  activeTab = signal<'answer' | 'contradictions' | 'insights'>('answer');

  getPositionsArray(positions: Record<string, string>): { modelId: string; position: string }[] {
    return Object.entries(positions).map(([modelId, position]) => ({ modelId, position }));
  }

  getModelDisplayName(modelId: string): string {
    const found = this.modelsInfo.find(m => m.id === modelId);
    return found ? found.displayName : modelId;
  }

  getModelColor(modelId: string): string {
    const found = this.modelsInfo.find(m => m.id === modelId);
    return found ? found.color : 'var(--primary)';
  }
}
