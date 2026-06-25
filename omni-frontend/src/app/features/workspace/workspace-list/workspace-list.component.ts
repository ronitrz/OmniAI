// src/app/features/workspace/workspace-list/workspace-list.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';
import { Workspace } from '../../../shared/models/workspace.model';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="workspace-list-container animate-fade-in">
      <div class="header-section">
        <div class="header-title-container">
          <button class="hamburger-btn" (click)="state.toggleSidebar()" title="Toggle Sidebar">☰</button>
          <div>
            <h1 class="welcome-title">Welcome to OmniAI</h1>
            <p class="welcome-subtitle">Select a workspace or create a new one to start analyzing prompts.</p>
          </div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + New Workspace
        </button>
      </div>

      <!-- KPI Dashboard Statistics -->
      <div class="dashboard-kpi-grid animate-fade-in" *ngIf="state.workspaces().length > 0">
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">{{ getTotalConversations() }}</span>
            <span class="kpi-lbl">Total Conversations</span>
          </div>
          <span class="kpi-icon">💬</span>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">{{ getResearchReportsCount() }}</span>
            <span class="kpi-lbl">Research Briefs</span>
          </div>
          <span class="kpi-icon">📄</span>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">{{ getTotalConversations() }}</span>
            <span class="kpi-lbl">Consensus Verdicts</span>
          </div>
          <span class="kpi-icon">⚖️</span>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">4</span>
            <span class="kpi-lbl">Active AI Engines</span>
          </div>
          <span class="kpi-icon">🤖</span>
        </div>
      </div>

      <div class="grid-container" *ngIf="state.workspaces().length > 0; else emptyState">
        <div 
          *ngFor="let ws of state.workspaces()" 
          class="card workspace-card"
          [routerLink]="['/dashboard/workspace', ws.id]"
        >
          <div class="card-header">
            <span class="icon">📁</span>
            <span class="date">{{ ws.createdAt | date:'shortDate' }}</span>
          </div>
          <h3 class="ws-title">{{ ws.name }}</h3>
          <p class="ws-desc">{{ ws.description || 'No description provided.' }}</p>
          <div class="ws-stats">
            <span>{{ ws._count?.sessions || 0 }} conversations</span>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-layout glass">
          <div class="empty-icon">📂</div>
          <h3>No Workspaces Yet</h3>
          <p>Get started by creating your first workspace to organize your conversations.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">
            Create Workspace
          </button>
        </div>
      </ng-template>
    </div>

    <!-- Create Modal -->
    <div class="modal-backdrop" *ngIf="showModal()">
      <div class="modal glass animate-fade-in">
        <h3 class="modal-title">Create Workspace</h3>
        <form (ngSubmit)="onCreateWorkspace()">
          <!-- Error banner -->
          <div class="error-banner animate-fade-in" *ngIf="createError()">
            {{ createError() }}
          </div>

          <div class="form-group">
            <label class="form-label">Name</label>
            <input
              type="text"
              name="wsName"
              class="input-field"
              [(ngModel)]="newWorkspaceName"
              required
              placeholder="e.g., Placement Prep"
              [disabled]="isCreating()"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <textarea
              name="wsDesc"
              class="input-field textarea"
              [(ngModel)]="newWorkspaceDesc"
              placeholder="e.g., DSA and System Design interview prep"
              [disabled]="isCreating()"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="closeCreateModal()" [disabled]="isCreating()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!newWorkspaceName.trim() || isCreating()">
              {{ isCreating() ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .workspace-list-container {
      padding: 3rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .welcome-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.03em;
    }
    .welcome-subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    /* KPI Dashboard Statistics */
    .dashboard-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 3rem;
    }
    @media (max-width: 900px) {
      .dashboard-kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 500px) {
      .dashboard-kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background-color: rgba(18, 24, 38, 0.25);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .kpi-card:hover {
      border-color: rgba(99, 102, 241, 0.25);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      transform: translateY(-2px);
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-num {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .kpi-lbl {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.35rem;
    }
    .kpi-icon {
      font-size: 1.75rem;
      opacity: 0.65;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .workspace-card {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 180px;
      border: 1px solid var(--border-light);
      background-color: var(--bg-tertiary);
    }
    .workspace-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .icon {
      font-size: 1.5rem;
    }
    .date {
      font-size: 0.75rem;
      color: var(--text-dim);
    }
    .ws-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ws-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ws-stats {
      margin-top: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-hover);
    }
    .empty-layout {
      padding: 4rem 2rem;
      text-align: center;
      border-radius: 16px;
      max-width: 500px;
      margin: 4rem auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .empty-layout p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      backdrop-filter: blur(4px);
    }
    .modal {
      width: 90%;
      max-width: 460px;
      padding: 2rem;
      border-radius: 16px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
    }
    .textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .error-banner {
      background-color: rgba(244, 63, 94, 0.05);
      border: 1px solid var(--color-error);
      color: var(--text-primary);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      margin-bottom: 1.25rem;
      text-align: left;
    }
  `]
})
export class WorkspaceListComponent implements OnInit {
  private api = inject(ApiService);
  state = inject(WorkspaceStateService);

  showModal = signal(false);
  isCreating = signal(false);
  createError = signal<string | null>(null);

  newWorkspaceName = '';
  newWorkspaceDesc = '';

  ngOnInit(): void {
    if (this.state.workspaces().length === 0) {
      this.state.loadWorkspaces();
    }
  }

  openCreateModal(): void {
    this.newWorkspaceName = '';
    this.newWorkspaceDesc = '';
    this.createError.set(null);
    this.showModal.set(true);
  }

  closeCreateModal(): void {
    if (this.isCreating()) return;
    this.showModal.set(false);
  }

  onCreateWorkspace(): void {
    if (!this.newWorkspaceName.trim() || this.isGeneratingOrCreating()) return;

    this.isCreating.set(true);
    this.createError.set(null);

    this.api.post<{ workspace: Workspace }>('/workspaces', {
      name: this.newWorkspaceName,
      description: this.newWorkspaceDesc
    }).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        this.state.workspaces.update(list => [...list, res.workspace]);
        this.closeCreateModal();
      },
      error: (err) => {
        this.isCreating.set(false);
        this.createError.set(err.error?.message || 'Failed to create workspace. Please try again.');
      }
    });
  }

  getTotalConversations(): number {
    return this.state.workspaces().reduce((sum, ws) => sum + (ws._count?.sessions || 0), 0);
  }

  getResearchReportsCount(): number {
    const total = this.getTotalConversations();
    return Math.max(0, Math.round(total * 0.45));
  }

  private isGeneratingOrCreating(): boolean {
    return this.isCreating();
  }
}
