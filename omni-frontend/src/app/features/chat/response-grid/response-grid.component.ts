// src/app/features/chat/response-grid/response-grid.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponseCardComponent, CardStreamState } from '../response-card/response-card.component';
import { ModelInfo } from '../model-selector/model-selector.component';

@Component({
  selector: 'app-response-grid',
  standalone: true,
  imports: [CommonModule, ResponseCardComponent],
  template: `
    <div class="grid-layout" [ngClass]="gridClass">
      <div *ngFor="let model of selectedModels" class="grid-item">
        <app-response-card
          [modelId]="model.id"
          [displayName]="model.displayName"
          [color]="model.color"
          [tier]="model.tier"
          [state]="streamStates[model.id] || getIdleState()"
        ></app-response-card>
      </div>
    </div>
  `,
  styles: [`
    .grid-layout {
      display: grid;
      gap: 1.25rem;
      width: 100%;
      height: 100%;
    }
    
    /* Responsive grid columns */
    .grid-layout.cols-1 {
      grid-template-columns: 1fr;
    }
    .grid-layout.cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid-layout.cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .grid-layout.cols-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: 900px) {
      .grid-layout.cols-3,
      .grid-layout.cols-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 600px) {
      .grid-layout.cols-2,
      .grid-layout.cols-3,
      .grid-layout.cols-4 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResponseGridComponent {
  @Input() selectedModels: ModelInfo[] = [];
  @Input() streamStates: Record<string, CardStreamState> = {};

  get gridClass(): string {
    const count = this.selectedModels.length;
    return `cols-${Math.max(1, Math.min(4, count))}`;
  }

  getIdleState(): CardStreamState {
    return { status: 'idle', content: '' };
  }
}
