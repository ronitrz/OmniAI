// src/app/features/chat/research-report/research-report.component.ts
import { Component, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { ModelInfo } from '../model-selector/model-selector.component';
import { CardStreamState } from '../response-card/response-card.component';

interface ReportSections {
  executiveSummary: string;
  keyFindings: string;
  agreements: string;
  contradictions: string;
  conclusion: string;
  hasSections: boolean;
}

@Component({
  selector: 'app-research-report',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  template: `
    <div class="research-report-container glass animate-fade-in">
      <div class="report-header">
        <div class="title-area">
          <span class="report-icon">📄</span>
          <h2 class="report-title">Research Intelligence Brief</h2>
        </div>
        <div class="models-row">
          <span class="meta-label">Compiled by:</span>
          <div class="models-list">
            <span 
              *ngFor="let model of selectedModels" 
              class="model-chip"
              [class.active]="activeModelId() === model.id"
              (click)="activeModelId.set(model.id)"
            >
              <span class="chip-avatar" [style.background]="getAvatarGradient(model.id)">
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
          <div class="report-document-sections" *ngIf="state.content">
            <ng-container *ngIf="getSections(state.content) as report">
              
              <!-- If we have parsed headers, show structured cards -->
              <div class="report-structured-layout" *ngIf="report.hasSections; else fallbackRaw">
                
                <!-- Executive Summary -->
                <div class="report-section-card glass" *ngIf="report.executiveSummary">
                  <div class="r-section-header">
                    <span class="r-section-icon">📋</span>
                    <h3 class="r-section-title">Executive Summary</h3>
                  </div>
                  <div class="r-section-content" [innerHTML]="report.executiveSummary | markdown"></div>
                </div>

                <!-- Key Findings -->
                <div class="report-section-card glass" *ngIf="report.keyFindings">
                  <div class="r-section-header">
                    <span class="r-section-icon">🔑</span>
                    <h3 class="r-section-title">Key Findings</h3>
                  </div>
                  <div class="r-section-content" [innerHTML]="report.keyFindings | markdown"></div>
                </div>

                <!-- Agreements & Contradictions Grid -->
                <div class="report-grid-panel" *ngIf="report.agreements || report.contradictions">
                  <div class="report-section-card glass" *ngIf="report.agreements">
                    <div class="r-section-header">
                      <span class="r-section-icon">🤝</span>
                      <h3 class="r-section-title">Agreements</h3>
                    </div>
                    <div class="r-section-content" [innerHTML]="report.agreements | markdown"></div>
                  </div>

                  <div class="report-section-card glass" *ngIf="report.contradictions">
                    <div class="r-section-header text-rose">
                      <span class="r-section-icon">⚡</span>
                      <h3 class="r-section-title">Contradictions</h3>
                    </div>
                    <div class="r-section-content" [innerHTML]="report.contradictions | markdown"></div>
                  </div>
                </div>

                <!-- Conclusion -->
                <div class="report-section-card glass conclusion-card" *ngIf="report.conclusion">
                  <div class="r-section-header">
                    <span class="r-section-icon">🎯</span>
                    <h3 class="r-section-title">Conclusion</h3>
                  </div>
                  <div class="r-section-content" [innerHTML]="report.conclusion | markdown"></div>
                </div>
              </div>

              <!-- Fallback layout when there are no section headings -->
              <ng-template #fallbackRaw>
                <div class="report-document" [innerHTML]="state.content | markdown"></div>
              </ng-template>

            </ng-container>
          </div>

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
      border-radius: 20px;
      border: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      overflow: hidden;
      margin-top: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .report-header {
      padding: 1.75rem 2rem;
      border-bottom: 1px solid var(--border-light);
      background-color: rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .title-area {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .report-icon {
      font-size: 1.75rem;
      animation: rotate-briefcase 4s ease-in-out infinite alternate;
    }
    @keyframes rotate-briefcase {
      0% { transform: translateY(-2px); }
      100% { transform: translateY(2px); }
    }
    .report-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .models-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .meta-label {
      font-size: 0.7rem;
      font-weight: 750;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.08em;
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
      padding: 0.35rem 0.875rem 0.35rem 0.5rem;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.25s ease;
    }
    .model-chip:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .model-chip.active {
      color: #ffffff;
      background-color: var(--primary-glow);
      border-color: var(--primary);
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.15);
    }
    .chip-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 700;
      color: #fff;
    }
    
    .report-body {
      padding: 2.5rem;
      background-color: rgba(0, 0, 0, 0.08);
      min-height: 300px;
    }
    
    /* Structured brief styles */
    .report-structured-layout {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .report-section-card {
      padding: 1.75rem 2rem;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background-color: rgba(18, 24, 38, 0.2);
    }
    .r-section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 0.75rem;
    }
    .r-section-icon {
      font-size: 1.25rem;
    }
    .r-section-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .r-section-content {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.8;
    }
    .r-section-content ::ng-deep p {
      margin-bottom: 1rem;
    }
    .r-section-content ::ng-deep p:last-child {
      margin-bottom: 0;
    }
    .r-section-content ::ng-deep ul,
    .r-section-content ::ng-deep ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .r-section-content ::ng-deep li {
      margin-bottom: 0.5rem;
    }
    
    .report-grid-panel {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .report-grid-panel {
        grid-template-columns: 1fr;
      }
    }
    
    .conclusion-card {
      border-left: 4px solid var(--primary);
    }
    .text-rose {
      color: var(--color-error);
    }
    
    /* Fallback raw document styling */
    .report-document {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.8;
      max-width: 900px;
      margin: 0 auto;
    }
    .report-document ::ng-deep h1,
    .report-document ::ng-deep h2,
    .report-document ::ng-deep h3 {
      color: var(--text-primary);
      margin-top: 1.75rem;
      margin-bottom: 0.875rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 0.5rem;
      font-weight: 700;
    }
    .report-document ::ng-deep h2 { font-size: 1.375rem; }
    .report-document ::ng-deep h3 { font-size: 1.125rem; }
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
      background-color: rgba(244, 63, 94, 0.04);
      border: 1px solid rgba(244, 63, 94, 0.1);
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
      color: var(--text-muted);
    }
    .empty-report-text {
      text-align: center;
      color: var(--text-dim);
      padding: 3rem 0;
      font-size: 0.875rem;
    }
  `]
})
export class ResearchReportComponent implements OnChanges {
  @Input() selectedModels: ModelInfo[] = [];
  @Input() streamStates: Record<string, CardStreamState> = {};

  activeModelId = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
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

  getAvatarGradient(modelId: string): string {
    if (modelId === 'gpt-4o') {
      return 'linear-gradient(135deg, #10a37f 0%, #15803d 100%)';
    }
    if (modelId === 'gemini-flash') {
      return 'linear-gradient(135deg, #4285f4 0%, #7c3aed 100%)';
    }
    if (modelId === 'claude-haiku') {
      return 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    }
    if (modelId === 'deepseek-chat') {
      return 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)';
    }
    return 'linear-gradient(135deg, #6366f1 0%, #000 100%)';
  }

  getSections(content: string): ReportSections {
    const sections: ReportSections = {
      executiveSummary: '',
      keyFindings: '',
      agreements: '',
      contradictions: '',
      conclusion: '',
      hasSections: false
    };

    if (!content) return sections;

    const cleanContent = content.toLowerCase();
    const hasAnyHeader = cleanContent.includes('executive summary') || 
                         cleanContent.includes('key findings') || 
                         cleanContent.includes('agreements') || 
                         cleanContent.includes('contradictions') || 
                         cleanContent.includes('conclusion');

    if (!hasAnyHeader) {
      sections.executiveSummary = content;
      return sections;
    }

    sections.hasSections = true;

    // Split text by markdown headings
    const regex = /(^|\n)(#+\s*[^\n]+)/g;
    const matches = [...content.matchAll(regex)];

    if (matches.length === 0) {
      sections.executiveSummary = content;
      sections.hasSections = false;
      return sections;
    }

    let lastIndex = 0;
    let lastSection: keyof Omit<ReportSections, 'hasSections'> = 'executiveSummary';

    const mapHeaderToKey = (headerText: string): keyof Omit<ReportSections, 'hasSections'> => {
      const text = headerText.toLowerCase();
      if (text.includes('summary') || text.includes('executive')) return 'executiveSummary';
      if (text.includes('finding') || text.includes('key')) return 'keyFindings';
      if (text.includes('agreement')) return 'agreements';
      if (text.includes('contradict') || text.includes('disagree') || text.includes('difference')) return 'contradictions';
      if (text.includes('conclusion') || text.includes('recommendation') || text.includes('final') || text.includes('summary & conclusion')) return 'conclusion';
      return lastSection;
    };

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchIndex = match.index || 0;
      
      const blockContent = content.slice(lastIndex, matchIndex).trim();
      if (blockContent) {
        sections[lastSection] = (sections[lastSection] ? sections[lastSection] + '\n\n' : '') + blockContent;
      }

      const headerLine = match[2];
      const headerText = headerLine.replace(/#+/g, '').trim();
      
      lastSection = mapHeaderToKey(headerText);
      lastIndex = matchIndex + match[0].length;
    }

    const lastBlockContent = content.slice(lastIndex).trim();
    if (lastBlockContent) {
      sections[lastSection] = (sections[lastSection] ? sections[lastSection] + '\n\n' : '') + lastBlockContent;
    }

    return sections;
  }
}
