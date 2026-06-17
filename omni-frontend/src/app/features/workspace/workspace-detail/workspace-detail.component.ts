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
      <!-- Workspace Header -->
      <div class="header-section">
        <div>
          <div class="breadcrumbs">
            <span routerLink="/dashboard" (click)="state.clear()" class="breadcrumb-link">Workspaces</span>
            <span class="separator">/</span>
            <span class="current">{{ workspace()?.name }}</span>
          </div>
          <h1 class="ws-title">{{ workspace()?.name }}</h1>
          <p class="ws-desc">{{ workspace()?.description || 'No description provided.' }}</p>
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

      <!-- Sessions List -->
      <div class="sessions-section">
        <h2 class="section-title">Conversations</h2>
        
        <div class="grid-container" *ngIf="sessions().length > 0; else emptyState">
          <div 
            *ngFor="let session of sessions()" 
            class="card session-card"
            [routerLink]="['/dashboard/session', session.id]"
          >
            <div class="session-card-header">
              <span class="chat-icon">💬</span>
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
            <div class="empty-icon">💬</div>
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
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
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
      border-color: rgba(239, 68, 68, 0.2);
    }
    .delete-btn:hover {
      background-color: rgba(239, 68, 68, 0.05);
      border-color: var(--color-error);
    }
    
    .sessions-section {
      margin-top: 1rem;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
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
      height: 140px;
      position: relative;
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
      color: var(--text-muted);
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
      font-weight: 600;
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
      color: var(--text-muted);
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
  `]
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);
  state = inject(WorkspaceStateService);

  workspace = signal<Workspace | null>(null);
  sessions = signal<Session[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const workspaceId = params['id'];
      if (workspaceId) {
        this.state.activeWorkspaceId.set(workspaceId);
        this.state.activeSessionId.set(null);
        this.state.loadSidebarSessions(workspaceId);
        this.loadWorkspaceDetails(workspaceId);
        this.loadSessions(workspaceId);
      }
    });
  }

  loadWorkspaceDetails(id: string): void {
    this.api.get<{ workspaces: Workspace[] }>('/workspaces').subscribe({
      next: (res) => {
        const found = res.workspaces.find(w => w.id === id);
        if (found) {
          this.workspace.set(found);
        } else {
          this.state.clear();
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.state.clear();
        this.router.navigate(['/dashboard']);
      }
    });
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

    this.api.post<{ session: Session }>(`/workspaces/${ws.id}/sessions`, {
      title: 'New Conversation'
    }).subscribe({
      next: (res) => {
        // Refresh sidebar sessions to include this new one
        this.state.loadSidebarSessions(ws.id);
        this.router.navigate(['/dashboard/session', res.session.id]);
      },
      error: () => {}
    });
  }

  onDeleteWorkspace(): void {
    const ws = this.workspace();
    if (!ws) return;

    if (confirm(`Are you sure you want to delete workspace "${ws.name}"? This will delete all conversations inside it.`)) {
      this.api.delete(`/workspaces/${ws.id}`).subscribe({
        next: () => {
          this.state.clear();
          this.router.navigate(['/dashboard']);
        },
        error: () => {}
      });
    }
  }

  onDeleteSession(sessionId: string, event: Event): void {
    event.stopPropagation(); // Prevent card navigation trigger

    if (confirm('Are you sure you want to delete this conversation?')) {
      this.api.delete(`/sessions/${sessionId}`).subscribe({
        next: () => {
          this.sessions.update(list => list.filter(s => s.id !== sessionId));
          // Refresh sidebar list
          const ws = this.workspace();
          if (ws) this.state.loadSidebarSessions(ws.id);
        },
        error: () => {}
      });
    }
  }
}
