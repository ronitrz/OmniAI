// src/app/features/chat/response-card/response-card.component.ts
import { Component, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
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
            <!-- OpenAI SVG -->
            <svg *ngIf="modelId === 'gpt-4o'" class="model-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
            </svg>
            <!-- Gemini SVG -->
            <svg *ngIf="modelId === 'gemini-flash'" class="model-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
            </svg>
            <!-- Claude SVG -->
            <svg *ngIf="modelId === 'claude-haiku'" class="model-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
            </svg>
            <!-- DeepSeek SVG -->
            <svg *ngIf="modelId === 'deepseek-chat'" class="model-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/>
            </svg>
            <svg *ngIf="!modelId" class="model-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-3-9a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 11zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 11zm-6 4a3 3 0 0 0 6 0Z"/>
            </svg>
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

        <!-- Rendered Markdown Content (with shared phrase highlights if available) -->
        <div
          class="markdown-content"
          *ngIf="state.content"
          [innerHTML]="highlightedHtml || (state.content | markdown)"
        ></div>

        <!-- Shared highlights legend -->
        <div class="shared-legend" *ngIf="sharedPhrases.length > 0 && state.status === 'complete' && state.content">
          <span class="legend-dot"></span>
          <span class="legend-text">Highlighted text appears in multiple model responses</span>
        </div>

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
    
    .model-logo-svg {
      width: 20px;
      height: 20px;
      color: #ffffff;
      display: block;
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

    /* Shared phrase highlight */
    .markdown-content ::ng-deep .shared-highlight {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0.10));
      border-radius: 3px;
      padding: 0.05em 0.15em;
      border-bottom: 1.5px solid rgba(16, 185, 129, 0.5);
      color: inherit;
    }
    .light-theme .markdown-content ::ng-deep .shared-highlight {
      background: rgba(16, 185, 129, 0.12);
      border-bottom-color: rgba(16, 185, 129, 0.4);
    }

    /* Shared phrases legend */
    .shared-legend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0.3));
      border: 1.5px solid rgba(16, 185, 129, 0.5);
    }
    .legend-text {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-style: italic;
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
export class ResponseCardComponent implements OnChanges {
  @Input() modelId: string = '';
  @Input() displayName: string = '';
  @Input() color: string = '#6366f1';
  @Input() tier: 'live' | 'demo' = 'demo';
  @Input() state: CardStreamState = { status: 'idle', content: '' };
  @Input() sharedPhrases: string[] = [];

  copied = signal(false);
  highlightedHtml: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sharedPhrases'] || changes['state']) {
      this.rebuildHighlightedHtml();
    }
  }

  private rebuildHighlightedHtml(): void {
    if (!this.state.content || this.sharedPhrases.length === 0) {
      this.highlightedHtml = null;
      return;
    }
    // Use the markdown pipe logic inline to first convert to HTML, then highlight
    // We'll highlight on the raw markdown text level to avoid breaking HTML tags
    let text = this.state.content;
    const sorted = [...this.sharedPhrases].sort((a, b) => b.length - a.length);
    for (const phrase of sorted) {
      if (phrase.length < 15) continue; // skip very short phrases
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      text = text.replace(regex, '==HIGHLIGHT_START==$1==HIGHLIGHT_END==');
    }
    // Convert to HTML via simple markdown-like rendering then restore highlights
    // We render highlights as mark tags which survive plain text rendering
    text = text
      .replace(/==HIGHLIGHT_START==/g, '<mark class="shared-highlight">')
      .replace(/==HIGHLIGHT_END==/g, '</mark>');
    this.highlightedHtml = this.renderMarkdownWithHighlights(text);
  }

  private renderMarkdownWithHighlights(text: string): string {
    // Minimal markdown rendering that preserves <mark> tags
    return text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[hul])(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`);
  }

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
