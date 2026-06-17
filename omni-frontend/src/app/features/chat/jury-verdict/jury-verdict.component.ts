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
    <div class="verdict-card card glass animate-fade-in" *ngIf="verdict">
      <div class="verdict-header">
        <h2 class="title">Jury Verdict</h2>
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
          <p class="summary-text">{{ verdict.consensusText }}</p>
          <div class="recommendation" *ngIf="verdict.recommendation">
            <span class="lightbulb">💡</span>
            <div class="recommendation-content">
              <span class="recommendation-label">Consensus Recommendation:</span>
              <p class="recommendation-text">{{ verdict.recommendation }}</p>
            </div>
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
            Agreements ({{ verdict.agreements.length }})
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'contradictions'"
            (click)="activeTab.set('contradictions')"
          >
            Contradictions ({{ verdict.contradictions.length }})
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'insights'"
            (click)="activeTab.set('insights')"
          >
            Unique Insights ({{ verdict.uniqueInsights.length }})
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
      padding: 2rem;
      border-radius: 16px;
      margin-top: 2rem;
      border-color: rgba(99, 102, 241, 0.15);
      background-color: rgba(18, 24, 38, 0.4);
    }
    .verdict-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 1rem;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .badge.high {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--color-live);
    }
    .badge.medium {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--color-demo);
    }
    .badge.low {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }
    .verdict-layout {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    @media (max-width: 768px) {
      .verdict-layout {
        flex-direction: column;
        align-items: center;
      }
    }
    .gauge-section {
      flex-shrink: 0;
    }
    .consensus-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .summary-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }
    .recommendation {
      display: flex;
      gap: 0.75rem;
      background-color: rgba(99, 102, 241, 0.04);
      border: 1px dashed rgba(99, 102, 241, 0.2);
      padding: 1rem;
      border-radius: 10px;
    }
    .lightbulb {
      font-size: 1.25rem;
      line-height: 1;
    }
    .recommendation-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .recommendation-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .recommendation-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    /* Tabs styling */
    .analysis-tabs-container {
      border: 1px solid var(--border-light);
      border-radius: 12px;
      overflow: hidden;
      background-color: rgba(0, 0, 0, 0.15);
    }
    .tabs-header {
      display: flex;
      background-color: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-light);
    }
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.875rem 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      background-color: rgba(255, 255, 255, 0.02);
      color: var(--text-primary);
    }
    .tab-btn.active {
      color: var(--primary);
      background-color: rgba(255, 255, 255, 0.03);
      border-bottom: 2px solid var(--primary);
      padding-bottom: calc(0.875rem - 2px);
    }
    .tab-body {
      padding: 1.5rem;
      min-height: 120px;
    }
    
    .analysis-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .analysis-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .item-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-icon.check {
      color: var(--color-live);
      font-weight: 700;
      font-size: 1rem;
      line-height: 1.2;
    }
    .item-icon.model-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.5rem;
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
      gap: 1.5rem;
    }
    .contradiction-item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .contradiction-topic {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .positions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }
    .position-card {
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .position-text {
      font-size: 0.8125rem;
      line-height: 1.4;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    .empty-tab-text {
      font-size: 0.875rem;
      color: var(--text-muted);
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
