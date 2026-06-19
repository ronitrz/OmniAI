// src/app/shared/components/confidence-gauge/confidence-gauge.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confidence-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gauge-container">
      <svg class="gauge" viewBox="0 0 100 100">
        <defs>
          <!-- High Agreement Gradient -->
          <linearGradient id="highGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
          <!-- Medium Agreement Gradient -->
          <linearGradient id="medGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
          <!-- Low Agreement Gradient -->
          <linearGradient id="lowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#e11d48" />
          </linearGradient>
          <!-- Glow Filter -->
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <!-- Background Track -->
        <circle
          class="gauge-bg"
          cx="50"
          cy="50"
          r="40"
          stroke-width="7"
        />
        <!-- Progress Stroke -->
        <circle
          class="gauge-progress"
          [attr.stroke]="getStrokeColor()"
          cx="50"
          cy="50"
          r="40"
          stroke-width="8"
          [attr.stroke-dasharray]="strokeDashArray"
          [attr.stroke-dashoffset]="strokeDashOffset"
          filter="url(#gaugeGlow)"
        />
      </svg>
      <div class="gauge-content">
        <span class="percentage" [ngClass]="colorClass">{{ percentText }}</span>
        <span class="label">{{ label }} AGREEMENT</span>
      </div>
    </div>
  `,
  styles: [`
    .gauge-container {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gauge {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .gauge-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.04);
    }
    .gauge-progress {
      fill: none;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .gauge-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 10px;
    }
    .percentage {
      font-size: 1.875rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .percentage.high {
      color: #10b981;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    }
    .percentage.medium {
      color: #f59e0b;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
    }
    .percentage.low {
      color: #f43f5e;
      text-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
    }
    .label {
      font-size: 0.55rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      margin-top: 0.25rem;
    }
  `]
})
export class ConfidenceGaugeComponent implements OnChanges {
  @Input() score: number = 0; // 0.0 to 1.0
  @Input() label: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  strokeDashArray = 2 * Math.PI * 40; // 251.3
  strokeDashOffset = 251.3;

  ngOnChanges(): void {
    const clampedScore = Math.max(0, Math.min(1, this.score));
    this.strokeDashOffset = this.strokeDashArray * (1 - clampedScore);
  }

  get percentText(): string {
    return `${Math.round(this.score * 100)}%`;
  }

  get colorClass(): string {
    return this.label.toLowerCase();
  }

  getStrokeColor(): string {
    if (this.label === 'HIGH') return 'url(#highGrad)';
    if (this.label === 'MEDIUM') return 'url(#medGrad)';
    return 'url(#lowGrad)';
  }
}
