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
        <!-- Background Circle -->
        <circle
          class="gauge-bg"
          cx="50"
          cy="50"
          r="40"
          stroke-width="8"
        />
        <!-- Progress Circle -->
        <circle
          class="gauge-progress"
          [ngClass]="colorClass"
          cx="50"
          cy="50"
          r="40"
          stroke-width="8"
          [attr.stroke-dasharray]="strokeDashArray"
          [attr.stroke-dashoffset]="strokeDashOffset"
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
      width: 120px;
      height: 120px;
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
      stroke: var(--bg-tertiary);
    }
    .gauge-progress {
      fill: none;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.6s ease-out;
    }
    .gauge-progress.high {
      stroke: var(--color-live);
    }
    .gauge-progress.medium {
      stroke: var(--color-demo);
    }
    .gauge-progress.low {
      stroke: var(--color-error);
    }
    .gauge-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .percentage {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .percentage.high {
      color: var(--color-live);
    }
    .percentage.medium {
      color: var(--color-demo);
    }
    .percentage.low {
      color: var(--color-error);
    }
    .label {
      font-size: 0.55rem;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
      margin-top: 0.15rem;
    }
  `]
})
export class ConfidenceGaugeComponent implements OnChanges {
  @Input() score: number = 0; // 0.0 to 1.0
  @Input() label: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  strokeDashArray = 2 * Math.PI * 40; // Circle perimeter (2 * pi * r) = 251.3
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
}
