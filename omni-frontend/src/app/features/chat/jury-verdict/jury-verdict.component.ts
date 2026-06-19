// src/app/features/chat/jury-verdict/jury-verdict.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuryVerdict } from '../../../shared/models/verdict.model';
import { ModelInfo } from '../model-selector/model-selector.component';
import { ConfidenceGaugeComponent } from '../../../shared/components/confidence-gauge/confidence-gauge.component';

@Component({
  selector: 'app-jury-verdict',
  standalone: true,
  imports: [CommonModule, ConfidenceGaugeComponent],
  template: `
    <div class="verdict-card" *ngIf="verdict">
      <div class="verdict-header">
        <div class="header-main">
          <span class="scale-icon">⚖️</span>
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
              <span class="m-icon">🤝</span>
              <div class="m-details">
                <span class="m-val">{{ verdict.agreements.length }}</span>
                <span class="m-label">Agreements</span>
              </div>
            </div>
            <div class="metric-card glass">
              <span class="m-icon">⚡</span>
              <div class="m-details">
                <span class="m-val">{{ verdict.contradictions.length }}</span>
                <span class="m-label">Contradictions</span>
              </div>
            </div>
            <div class="metric-card glass">
              <span class="m-icon">💡</span>
              <div class="m-details">
                <span class="m-val">{{ verdict.uniqueInsights.length }}</span>
                <span class="m-label">Unique Insights</span>
              </div>
            </div>
          </div>

          <p class="summary-text">{{ verdict.consensusText }}</p>
          
          <div class="recommendation-card" *ngIf="verdict.recommendation">
            <div class="recommendation-badge">💡 ACTIONABLE RECOMMENDATION</div>
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
            [class.active]="activeTab() === 'agreements'"
            (click)="activeTab.set('agreements')"
          >
            🤝 Agreements
            <span class="tab-badge">{{ verdict.agreements.length }}</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'contradictions'"
            (click)="activeTab.set('contradictions')"
          >
            ⚡ Contradictions
            <span class="tab-badge">{{ verdict.contradictions.length }}</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'insights'"
            (click)="activeTab.set('insights')"
          >
            💡 Unique Insights
            <span class="tab-badge">{{ verdict.uniqueInsights.length }}</span>
          </button>
        </div>

        <div class="tab-body">
          <!-- Agreements Tab -->
          <div *ngIf="activeTab() === 'agreements'">
            <ul class="analysis-list" *ngIf="verdict.agreements.length > 0; else noAgreements">
              <li *ngFor="let agreement of verdict.agreements" class="analysis-item">
                <span class="item-icon check">✓</span>
                <p class="item-text">{{ agreement }}</p>
              </li>
            </ul>
            <ng-template #noAgreements>
              <p class="empty-tab-text">No strong consensus agreements were extracted.</p>
            </ng-template>
          </div>

          <!-- Contradictions Tab -->
          <div *ngIf="activeTab() === 'contradictions'">
            <div class="contradictions-list" *ngIf="verdict.contradictions.length > 0; else noContradictions">
              <div *ngFor="let item of verdict.contradictions" class="contradiction-item">
                <h4 class="contradiction-topic">⚔️ {{ item.topic }}</h4>
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
      padding: 2.25rem;
      border-radius: 20px;
      margin-top: 2.5rem;
      border: 1px solid rgba(99, 102, 241, 0.15);
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.4) 0%, rgba(11, 15, 25, 0.4) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
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
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
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
      gap: 2.5rem;
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
      background: rgba(0, 0, 0, 0.2);
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid var(--border-light);
    }
    
    .consensus-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
    }
    
    /* Metrics counters grid */
    .metrics-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    
    @media (max-width: 500px) {
      .metrics-summary-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .metric-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
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
      color: var(--text-primary);
      line-height: 1.1;
    }
    
    .m-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .summary-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--text-secondary);
    }
    
    .recommendation-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 2 purple, 0.01) 100%);
      border: 1px dashed rgba(99, 102, 241, 0.25);
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
      color: var(--text-primary);
    }
    
    /* Tabs selector layout */
    .analysis-tabs-container {
      border: 1px solid var(--border-light);
      border-radius: 16px;
      overflow: hidden;
      background-color: rgba(3, 7, 18, 0.4);
      margin-top: 2rem;
    }
    
    .tabs-header {
      display: flex;
      background-color: rgba(0, 0, 0, 0.3);
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
      color: var(--text-muted);
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
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.02);
    }
    
    .tab-btn.active {
      color: #ffffff;
      background-color: var(--primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
    
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.08);
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
      color: var(--text-secondary);
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
      color: var(--text-primary);
    }
    
    .positions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    
    .position-card {
      background-color: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--border-light);
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
      background-color: rgba(255, 255, 255, 0.025);
      border-color: rgba(255, 255, 255, 0.1);
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
      color: var(--text-secondary);
      font-style: italic;
    }
    
    .empty-tab-text {
      font-size: 0.875rem;
      color: var(--text-dim);
      text-align: center;
      padding: 2rem 0;
    }
  `]
})
export class JuryVerdictComponent {
  @Input() verdict: JuryVerdict | null = null;
  @Input() modelsInfo: ModelInfo[] = [];

  activeTab = signal<'agreements' | 'contradictions' | 'insights'>('agreements');

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
