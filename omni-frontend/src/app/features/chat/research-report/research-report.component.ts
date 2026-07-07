// src/app/features/chat/research-report/research-report.component.ts
import { Component, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { ModelInfo } from '../model-selector/model-selector.component';
import { CardStreamState } from '../response-card/response-card.component';
import { JuryVerdict } from '../../../shared/models/verdict.model';

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
          <span class="report-icon">🧠</span>
          <div class="title-text-group">
            <h2 class="report-title">Research Intelligence Brief</h2>
            <span class="report-subtitle">Synthesized Multi-Model Analysis</span>
          </div>
        </div>
        <div class="models-row">
          <span class="meta-label">View Mode:</span>
          <div class="models-list">
            <!-- Master Consensus Tab (Unified Mix of All Models) -->
            <button 
              type="button"
              class="model-chip master-chip"
              [class.active]="activeModelId() === 'master-consensus'"
              (click)="activeModelId.set('master-consensus')"
            >
              <span class="chip-avatar master-avatar">✨</span>
              <span class="chip-name">Master Consensus (Unified Mix)</span>
            </button>

            <!-- Individual Model Tabs -->
            <button 
              type="button"
              *ngFor="let model of selectedModels" 
              class="model-chip"
              [class.active]="activeModelId() === model.id"
              (click)="activeModelId.set(model.id)"
            >
              <span class="chip-avatar" [style.background]="getAvatarGradient(model.id)">
                <!-- OpenAI SVG -->
                <svg *ngIf="model.id === 'gpt-4o'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                </svg>
                <!-- Gemini SVG -->
                <svg *ngIf="model.id === 'gemini-flash'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
                </svg>
                <!-- Claude SVG -->
                <svg *ngIf="model.id === 'claude-haiku'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
                </svg>
                <!-- DeepSeek SVG -->
                <svg *ngIf="model.id === 'deepseek-chat'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/>
                </svg>
                <svg *ngIf="!model.id" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-3-9a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 11zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 11zm-6 4a3 3 0 0 0 6 0Z"/>
                </svg>
              </span>
              <span class="chip-name">{{ model.displayName }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Report View Body -->
      <div class="report-body">
        
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- VIEW MODE 1: MASTER CONSENSUS BRIEF (UNIFIED MIX OF ALL)       -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeModelId() === 'master-consensus'" class="master-consensus-view animate-fade-in">
          
          <!-- Master Synthesis Available -->
          <div *ngIf="verdict; else masterPendingOrFallback" class="report-structured-layout">
            
            <!-- Alert Badge Bar -->
            <div class="master-banner glass">
              <div class="banner-badge">
                <span class="sparkle-icon">✨</span>
                <span>Synthesized AI Intelligence Brief</span>
                <span class="confidence-pill" [class.high]="verdict.confidenceLabel === 'HIGH'" [class.medium]="verdict.confidenceLabel === 'MEDIUM'">
                  {{ getConfidencePercentage(verdict.confidenceScore) }}% {{ verdict.confidenceLabel }} CONSENSUS
                </span>
              </div>
              <p class="banner-sub">Combined research findings synthesized from {{ selectedModels.length }} models.</p>
              
              <!-- Participating Models Badges -->
              <div class="participating-models-row mt-2">
                <span *ngFor="let m of selectedModels" class="participating-badge">
                  <span class="dot-indicator" [style.background]="m.color"></span>
                  {{ m.displayName }}
                </span>
              </div>
            </div>

            <!-- Master Executive Summary -->
            <div class="report-section-card glass master-card">
              <div class="r-section-header">
                <span class="r-section-icon">📋</span>
                <h3 class="r-section-title">Master Executive Synthesis</h3>
              </div>
              <div class="r-section-content" [innerHTML]="verdict.consensusText | markdown"></div>
            </div>

            <!-- Synthesized Agreements & Universal Facts -->
            <div class="report-section-card glass" *ngIf="verdict.agreements && verdict.agreements.length > 0">
              <div class="r-section-header">
                <span class="r-section-icon">🤝</span>
                <h3 class="r-section-title">Key Synthesized Findings & Universal Facts</h3>
              </div>
              <ul class="agreement-bullet-list">
                <li *ngFor="let item of verdict.agreements" class="agreement-item">
                  <span class="check-icon">✓</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Discrepancies & Contradictions Grid -->
            <div class="report-grid-panel" *ngIf="verdict.contradictions && verdict.contradictions.length > 0">
              <div class="report-section-card glass" *ngFor="let c of verdict.contradictions">
                <div class="r-section-header text-rose">
                  <span class="r-section-icon">⚡</span>
                  <h3 class="r-section-title">Nuance: {{ c.topic }}</h3>
                </div>
                <div class="contradiction-positions">
                  <div *ngFor="let entry of getPositionsList(c.positions)" class="position-chip-box">
                    <span class="pos-model-name">{{ getModelNameById(entry.modelId) }}:</span>
                    <span class="pos-text">{{ entry.position }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Unique Model Takeaways -->
            <div class="report-section-card glass" *ngIf="verdict.uniqueInsights && verdict.uniqueInsights.length > 0">
              <div class="r-section-header">
                <span class="r-section-icon">💡</span>
                <h3 class="r-section-title">Unique Model Insights</h3>
              </div>
              <div class="unique-insights-grid">
                <div *ngFor="let insight of verdict.uniqueInsights" class="unique-insight-item">
                  <span class="insight-model-badge" [style.background]="getAvatarGradient(insight.modelId)">
                    {{ getModelNameById(insight.modelId) }}
                  </span>
                  <p class="insight-body">{{ insight.insight }}</p>
                </div>
              </div>
            </div>

            <!-- Actionable Strategic Recommendation -->
            <div class="report-section-card glass conclusion-card" *ngIf="verdict.recommendation">
              <div class="r-section-header">
                <span class="r-section-icon">🎯</span>
                <h3 class="r-section-title">Strategic Actionable Conclusion</h3>
              </div>
              <div class="r-section-content" [innerHTML]="verdict.recommendation | markdown"></div>
            </div>

          </div>

          <!-- Pending Deliberation or Fallback Master Synthesis -->
          <ng-template #masterPendingOrFallback>
            <div *ngIf="isDeliberating" class="master-deliberation-card glass animate-fade-in">
              <div class="deliberation-pulse">🧠</div>
              <h3>Synthesizing Multi-Model Master Consensus...</h3>
              <p>Merging facts, cross-verifying claims, and generating the unified research brief...</p>
              <div class="loader-progress-container mt-3">
                <div class="loader-progress-bar"></div>
              </div>
            </div>

            <!-- If not deliberating, synthesize live from available completed models -->
            <div *ngIf="!isDeliberating" class="report-structured-layout">
              <div class="master-banner glass">
                <div class="banner-badge">
                  <span class="sparkle-icon">✨</span>
                  <span>Unified Multi-Model Research Brief</span>
                </div>
                <p class="banner-sub">Synthesized across all participating models.</p>
              </div>

              <div class="report-section-card glass master-card">
                <div class="r-section-header">
                  <span class="r-section-icon">📋</span>
                  <h3 class="r-section-title">Synthesized Multi-Model Brief</h3>
                </div>
                <div class="r-section-content" [innerHTML]="getCombinedMasterContent() | markdown"></div>
              </div>
            </div>
          </ng-template>

        </div>


        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- VIEW MODE 2: INDIVIDUAL MODEL RESEARCH BREAKDOWN                -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeModelId() !== 'master-consensus'">
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
                        <h3 class="r-section-title">Agreements & Facts</h3>
                      </div>
                      <div class="r-section-content" [innerHTML]="report.agreements | markdown"></div>
                    </div>

                    <div class="report-section-card glass" *ngIf="report.contradictions">
                      <div class="r-section-header text-rose">
                        <span class="r-section-icon">⚡</span>
                        <h3 class="r-section-title">Contradictions & Risks</h3>
                      </div>
                      <div class="r-section-content" [innerHTML]="report.contradictions | markdown"></div>
                    </div>
                  </div>

                  <!-- Conclusion -->
                  <div class="report-section-card glass conclusion-card" *ngIf="report.conclusion">
                    <div class="r-section-header">
                      <span class="r-section-icon">🎯</span>
                      <h3 class="r-section-title">Strategic Conclusion</h3>
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
    .title-text-group {
      display: flex;
      flex-direction: column;
    }
    .report-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .report-subtitle {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-hover);
      text-transform: uppercase;
      letter-spacing: 0.06em;
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
      padding: 0.4rem 0.875rem 0.4rem 0.6rem;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.25s ease;
      font-family: inherit;
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
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.18);
    }
    .master-chip {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
      border-color: rgba(99, 102, 241, 0.3);
      color: var(--text-primary);
    }
    .master-chip.active {
      background: var(--primary-gradient);
      border-color: transparent;
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
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
    .master-avatar {
      background: none;
      font-size: 0.8rem;
    }
    
    .model-logo-svg-mini {
      width: 12px;
      height: 12px;
      color: #ffffff;
      display: block;
    }
    
    .report-body {
      padding: 2.5rem;
      background-color: rgba(0, 0, 0, 0.08);
      min-height: 300px;
    }
    
    /* Master Banner */
    .master-banner {
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1px solid var(--border-light);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(168, 85, 247, 0.03) 100%);
    }
    .banner-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .confidence-pill {
      font-size: 0.65rem;
      font-weight: 750;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background-color: rgba(16, 185, 129, 0.15);
      color: var(--color-live);
      border: 1px solid rgba(16, 185, 129, 0.3);
      letter-spacing: 0.05em;
    }
    .confidence-pill.medium {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--color-demo);
      border-color: rgba(245, 158, 11, 0.3);
    }
    .banner-sub {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
      margin-bottom: 0;
    }
    .participating-models-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .participating-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: rgba(0, 0, 0, 0.2);
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid var(--border-light);
    }
    .dot-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .master-card {
      border-left: 4px solid var(--primary);
    }

    .agreement-bullet-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .agreement-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.9375rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .check-icon {
      color: var(--color-success);
      font-weight: 800;
      font-size: 0.875rem;
      margin-top: 0.1rem;
    }
    .position-chip-box {
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-light);
      padding: 0.65rem 0.875rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      font-size: 0.8125rem;
    }
    .pos-model-name {
      font-weight: 750;
      color: var(--text-primary);
      margin-right: 0.5rem;
    }
    .pos-text {
      color: var(--text-muted);
    }
    .unique-insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .unique-insight-item {
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-light);
      padding: 1rem;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .insight-model-badge {
      font-size: 0.6875rem;
      font-weight: 750;
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      align-self: flex-start;
    }
    .insight-body {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .master-deliberation-card {
      padding: 3rem;
      border-radius: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 600px;
      margin: 2rem auto;
    }
    .deliberation-pulse {
      font-size: 3rem;
      animation: pulse-op 1.5s infinite alternate;
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
  @Input() verdict: JuryVerdict | null = null;
  @Input() isDeliberating: boolean = false;

  activeModelId = signal<string>('master-consensus');

  ngOnChanges(changes: SimpleChanges): void {
    // Keep 'master-consensus' as default
  }

  getActiveState(): CardStreamState | null {
    const id = this.activeModelId();
    if (!id || id === 'master-consensus') return null;
    return this.streamStates[id] || { status: 'idle', content: '' };
  }

  getModelNameById(modelId: string): string {
    const found = this.selectedModels.find(m => m.id === modelId);
    if (found) return found.displayName;
    if (modelId === 'gpt-4o') return 'GPT-5.4';
    if (modelId === 'gemini-flash') return 'Gemini';
    if (modelId === 'claude-haiku') return 'Claude';
    if (modelId === 'deepseek-chat') return 'DeepSeek';
    return modelId;
  }

  getConfidencePercentage(score: number): number {
    if (score === undefined || score === null) return 100;
    return score <= 1 ? Math.round(score * 100) : Math.round(score);
  }

  getPositionsList(positions: Record<string, string>): { modelId: string; position: string }[] {
    if (!positions) return [];
    return Object.keys(positions).map(key => ({
      modelId: key,
      position: positions[key]
    }));
  }

  getCombinedMasterContent(): string {
    // Generate a fallback master synthesis from available completed model stream states
    const modelIds = Object.keys(this.streamStates);
    let combined = '';
    modelIds.forEach(modelId => {
      const state = this.streamStates[modelId];
      if (state && state.content && state.content.trim().length > 0) {
        const modelName = this.getModelNameById(modelId);
        combined += `### Findings from ${modelName}\n\n${state.content}\n\n---\n\n`;
      }
    });
    return combined || 'Analyzing research parameters across AI models...';
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
      if (text.includes('agreement') || text.includes('consensus')) return 'agreements';
      if (text.includes('contradict') || text.includes('disagree') || text.includes('risk') || text.includes('difference')) return 'contradictions';
      if (text.includes('conclusion') || text.includes('recommendation') || text.includes('final')) return 'conclusion';
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
