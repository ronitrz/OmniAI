// src/app/features/chat/response-grid/response-grid.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
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
          [sharedPhrases]="sharedPhrases"
          [allowZoom]="allowZoom"
          (zoomIn)="onZoomIn(model)"
        ></app-response-card>
      </div>
    </div>
  `,
  styles: [`
    .grid-layout {
      display: grid;
      gap: 2rem;
      width: 100%;
      height: 100%;
    }

    .grid-layout.cols-1,
    .grid-layout.cols-2,
    .grid-layout.cols-3,
    .grid-layout.cols-4 {
      grid-template-columns: 1fr;
    }

    @media (max-width: 900px) {
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
  @Input() sharedPhrases: string[] = [];
  @Input() allowZoom: boolean = false;

  @Output() zoomModel = new EventEmitter<{ model: ModelInfo; state: CardStreamState }>();

  onZoomIn(model: ModelInfo): void {
    this.zoomModel.emit({ model, state: this.streamStates[model.id] || this.getIdleState() });
  }

  get gridClass(): string {
    return 'cols-1';
  }

  getIdleState(): CardStreamState {
    return { status: 'idle', content: '' };
  }
}
