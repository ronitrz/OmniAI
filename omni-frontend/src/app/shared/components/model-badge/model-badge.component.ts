// src/app/shared/components/model-badge/model-badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-model-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="tier">
      <span class="dot">●</span>
      <span class="label">{{ labelText }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      border: 1px solid transparent;
    }
    .badge.live {
      background-color: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: var(--color-live);
    }
    .badge.demo {
      background-color: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: var(--color-demo);
    }
    .dot {
      font-size: 0.625rem;
    }
    .label {
      line-height: 1;
    }
  `]
})
export class ModelBadgeComponent {
  @Input() tier: 'live' | 'demo' = 'demo';

  get labelText(): string {
    return this.tier === 'live' ? 'Live' : 'Demo';
  }
}
