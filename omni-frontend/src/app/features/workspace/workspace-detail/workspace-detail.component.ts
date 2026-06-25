// src/app/features/workspace/workspace-detail/workspace-detail.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';
import { Workspace } from '../../../shared/models/workspace.model';
import { Session } from '../../../shared/models/session.model';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="workspace-detail-container animate-fade-in" *ngIf="workspace()">
      <!-- Error Banner -->
      <div class="error-banner animate-fade-in" *ngIf="errorMsg()">
        <span>{{ errorMsg() }}</span>
        <button class="close-error-btn" (click)="errorMsg.set(null)">×</button>
      </div>

      <!-- Workspace Header -->
      <div class="header-section">
        <div class="header-title-container">
          <button class="hamburger-btn" (click)="state.toggleSidebar()" title="Toggle Sidebar">☰</button>
          <div>
            <div class="breadcrumbs">
              <span routerLink="/" (click)="state.clear()" class="breadcrumb-link">Workspaces</span>
              <span class="separator">/</span>
              <span class="current">{{ workspace()?.name }}</span>
            </div>
            <h1 class="ws-title">{{ workspace()?.name }}</h1>
            <p class="ws-desc">{{ workspace()?.description || 'No description provided.' }}</p>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-secondary delete-btn" (click)="onDeleteWorkspace()">
            Delete Workspace
          </button>
          <button class="btn btn-primary" (click)="onCreateSession()">
            + New Conversation
          </button>
        </div>
      </div>

      <!-- Workspace specific Metrics grid -->
      <div class="workspace-kpi-grid animate-fade-in" *ngIf="workspace()">
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">{{ sessions().length }}</span>
            <span class="kpi-lbl">Conversations</span>
          </div>
          <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--text-muted);">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num">4</span>
            <span class="kpi-lbl">Active AI Models</span>
          </div>
          <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--text-muted);">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="16" y1="16" x2="16" y2="16"></line>
          </svg>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="kpi-num-text">{{ getLastActiveDate() | date:'mediumDate' }}</span>
            <span class="kpi-lbl">Last Active</span>
          </div>
          <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--text-muted);">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>

      <!-- Sessions List -->
      <div class="sessions-section">
        <h2 class="section-title">Conversations</h2>
        
        <div class="grid-container" *ngIf="sessions().length > 0; else emptyState">
          <div 
            *ngFor="let session of sessions()" 
            class="card session-card animate-fade-in"
            [routerLink]="['/session', session.id]"
          >
            <div class="session-card-header">
              <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: var(--primary-hover);">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <button 
                class="delete-session-btn" 
                (click)="onDeleteSession(session.id, $event)" 
                title="Delete Conversation"
              >
                ×
              </button>
            </div>
            <h3 class="session-title">{{ session.title }}</h3>
            <div class="session-meta">
              <span>Updated: {{ session.updatedAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="empty-layout glass">
            <h3>No Conversations Yet</h3>
            <p>Start a new conversation with multiple AIs in this workspace.</p>
            <button class="btn btn-primary" (click)="onCreateSession()">
              Start Conversation
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .workspace-detail-container {
      padding: 3rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .breadcrumb-link {
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .breadcrumb-link:hover {
      color: var(--text-primary);
    }
    .separator {
      color: var(--border-light);
    }
    .ws-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .ws-desc {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      max-width: 800px;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
    }
    .delete-btn {
      color: var(--color-error);
      border-color: rgba(244, 63, 94, 0.2);
    }
    .delete-btn:hover {
      background-color: rgba(244, 63, 94, 0.05);
      border-color: var(--color-error);
    }

    /* Workspace KPI Grid */
    .workspace-kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 3rem;
    }
    @media (max-width: 768px) {
      .workspace-kpi-grid {
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
    .kpi-num-text {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.75rem;
      letter-spacing: -0.01em;
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
    
    .sessions-section {
      margin-top: 1rem;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      letter-spacing: -0.01em;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .session-card {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 150px;
      position: relative;
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .session-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .session-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-icon {
      font-size: 1.25rem;
    }
    .delete-session-btn {
      background: none;
      border: none;
      color: var(--text-dim);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;
      transition: color 0.2s;
    }
    .delete-session-btn:hover {
      color: var(--color-error);
    }
    .session-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      padding-top: 0.5rem;
    }
    .session-meta {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-weight: 500;
    }
    
    .empty-layout {
      padding: 4rem 2rem;
      text-align: center;
      border-radius: 16px;
      max-width: 500px;
      margin: 3rem auto;
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
    .error-banner {
      background-color: rgba(244, 63, 94, 0.05);
      border: 1px solid var(--color-error);
      color: var(--text-primary);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .close-error-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
    .close-error-btn:hover {
      color: var(--text-primary);
    }
  `]
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);
  state = inject(WorkspaceStateService);

  workspace = signal<Workspace | null>(null);
  sessions = signal<Session[]>([]);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const workspaceId = params['id'];
      if (workspaceId) {
        this.errorMsg.set(null);
        this.state.activeWorkspaceId.set(workspaceId);
        this.state.activeSessionId.set(null);
        this.state.loadSidebarSessions(workspaceId);
        this.loadWorkspaceDetails(workspaceId);
        this.loadSessions(workspaceId);
      }
    });
  }

  loadWorkspaceDetails(id: string): void {
    if (this.state.workspaces().length === 0) {
      this.api.get<{ workspaces: Workspace[] }>('/workspaces').subscribe({
        next: (res) => {
          this.state.workspaces.set(res.workspaces);
          const found = res.workspaces.find(w => w.id === id);
          if (found) {
            this.workspace.set(found);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: () => {
          this.router.navigate(['/']);
        }
      });
    } else {
      const found = this.state.workspaces().find(w => w.id === id);
      if (found) {
        this.workspace.set(found);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  loadSessions(workspaceId: string): void {
    this.api.get<{ sessions: Session[] }>(`/workspaces/${workspaceId}/sessions`).subscribe({
      next: (res) => this.sessions.set(res.sessions),
      error: () => {}
    });
  }

  onCreateSession(): void {
    const ws = this.workspace();
    if (!ws) return;

    this.errorMsg.set(null);
    this.api.post<{ session: Session }>(`/workspaces/${ws.id}/sessions`, {
      title: 'New Conversation'
    }).subscribe({
      next: (res) => {
        this.state.loadSidebarSessions(ws.id);
        this.router.navigate(['/session', res.session.id]);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to create conversation. Please try again.');
      }
    });
  }

  async onDeleteWorkspace(): Promise<void> {
    const ws = this.workspace();
    if (!ws) return;

    const confirmed = await this.state.confirm(
      'Delete Workspace',
      `Are you sure you want to delete workspace "${ws.name}"? This will delete all conversations inside it.`,
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (confirmed) {
      this.errorMsg.set(null);
      this.api.delete(`/workspaces/${ws.id}`).subscribe({
        next: () => {
          this.state.workspaces.update(list => list.filter(w => w.id !== ws.id));
          this.state.clear();
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Failed to delete workspace. Please try again.');
        }
      });
    }
  }

  async onDeleteSession(sessionId: string, event: Event): Promise<void> {
    event.stopPropagation(); // Prevent card navigation trigger

    const confirmed = await this.state.confirm(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (confirmed) {
      this.errorMsg.set(null);
      this.api.delete(`/sessions/${sessionId}`).subscribe({
        next: () => {
          this.sessions.update(list => list.filter(s => s.id !== sessionId));
          const ws = this.workspace();
          if (ws) this.state.loadSidebarSessions(ws.id);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Failed to delete conversation. Please try again.');
        }
      });
    }
  }

  getLastActiveDate(): Date | string {
    const list = this.sessions();
    if (list.length > 0) {
      const sorted = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return sorted[0].updatedAt;
    }
    const ws = this.workspace();
    return ws ? ws.createdAt : new Date();
  }
}
