// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';
import { Workspace } from '../../models/workspace.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="sidebar" [class.open]="state.sidebarOpen()">
      <div class="sidebar-header">
        <div class="logo-area" routerLink="/dashboard" (click)="state.clear(); state.sidebarOpen.set(false)">
          <span class="logo-icon">⚖️</span>
          <span class="logo-text">OmniAI</span>
        </div>
        <button class="close-sidebar-btn" (click)="state.sidebarOpen.set(false)" title="Close Menu">×</button>
      </div>

      <div class="sidebar-content">
        <div class="section-title">
          <span>WORKSPACES</span>
          <button class="add-btn" (click)="openCreateModal()" title="New Workspace">+</button>
        </div>

        <div class="workspace-list" *ngIf="!isLoading(); else loadingShimmer">
          <div *ngFor="let ws of state.workspaces()" class="workspace-item-container">
            <div
              class="workspace-item"
              [routerLink]="['/dashboard/workspace', ws.id]"
              [class.active]="state.activeWorkspaceId() === ws.id"
              (click)="state.sidebarOpen.set(false)"
            >
              <span class="ws-icon">📁</span>
              <span class="ws-name">{{ ws.name }}</span>
            </div>
            
            <!-- Conversations Sublist (displayed when workspace is active) -->
            <div class="session-sublist animate-fade-in" *ngIf="state.activeWorkspaceId() === ws.id">
              <div
                *ngFor="let session of state.sidebarSessions()"
                class="session-subitem"
                [routerLink]="['/dashboard/session', session.id]"
                [class.sub-active]="state.activeSessionId() === session.id"
                (click)="state.sidebarOpen.set(false)"
              >
                <span class="session-icon">💬</span>
                <span class="session-title-text">{{ session.title }}</span>
              </div>
              <div *ngIf="state.sidebarSessions().length === 0" class="empty-sublist">
                No conversations yet.
              </div>
            </div>
          </div>
          
          <div *ngIf="state.workspaces().length === 0" class="empty-state">
            No workspaces yet.
          </div>
        </div>

        <ng-template #loadingShimmer>
          <div class="workspace-loading-shimmer">
            <div class="shimmer loading-item" *ngFor="let i of [1, 2, 3]"></div>
          </div>
        </ng-template>
      </div>

      <div class="sidebar-footer" *ngIf="auth.currentUser() as user">
        <div class="user-info">
          <div class="user-avatar">{{ user.fullName.slice(0, 2).toUpperCase() }}</div>
          <div class="user-details">
            <div class="user-name">{{ user.fullName }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>
        <button class="btn btn-secondary logout-btn" (click)="onLogout()">
          Logout
        </button>
      </div>
    </div>

    <!-- Create Workspace Modal -->
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
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      transition: transform 0.3s ease-in-out;
    }
    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .close-sidebar-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .close-sidebar-btn:hover {
      color: var(--text-primary);
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }
    .logo-icon {
      font-size: 1.5rem;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      background: linear-gradient(to right, #ffffff, var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sidebar-content {
      flex: 1;
      padding: 1.5rem 1rem;
      overflow-y: auto;
    }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      padding: 0 0.5rem;
    }
    .add-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.25rem;
      font-weight: 300;
      cursor: pointer;
      line-height: 1;
    }
    .add-btn:hover {
      color: var(--text-primary);
    }
    .workspace-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .workspace-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .workspace-item:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }
    .workspace-item.active {
      background-color: var(--primary-glow);
      color: var(--primary);
      font-weight: 500;
      border-left: 3px solid var(--primary);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding-left: calc(0.75rem - 3px);
    }
    .ws-icon {
      font-size: 1rem;
    }
    .ws-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Sublist styling */
    .session-sublist {
      padding-left: 1.75rem;
      margin: 0.25rem 0 0.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    .session-subitem {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: 6px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .session-subitem:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }
    .session-subitem.sub-active {
      color: var(--primary);
      font-weight: 500;
      background-color: rgba(99, 102, 241, 0.05);
    }
    .session-icon {
      font-size: 0.875rem;
    }
    .session-title-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .empty-sublist {
      font-size: 0.7rem;
      color: var(--text-muted);
      padding: 0.25rem 0.5rem;
    }

    .empty-state {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: center;
      padding: 1rem 0;
    }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background-color: rgba(0, 0, 0, 0.1);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      background-color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
    }
    .user-details {
      flex: 1;
      min-width: 0;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logout-btn {
      width: 100%;
      font-size: 0.75rem;
      padding: 0.5rem;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .modal {
      width: 90%;
      max-width: 460px;
      padding: 2rem;
      border-radius: 16px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
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

    .workspace-loading-shimmer {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem;
    }
    .loading-item {
      height: 36px;
      border-radius: 8px;
      width: 100%;
    }
    .error-banner {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--color-error);
      color: var(--text-primary);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      margin-bottom: 1.25rem;
      text-align: left;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        box-shadow: 5px 0 25px rgba(0,0,0,0.5);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .close-sidebar-btn {
        display: block;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  router = inject(Router);
  state = inject(WorkspaceStateService);

  showModal = signal(false);
  isLoading = signal(false);
  isCreating = signal(false);
  createError = signal<string | null>(null);

  newWorkspaceName = '';
  newWorkspaceDesc = '';

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    if (localStorage.getItem('omni_token')) {
      this.isLoading.set(true);
      this.api.get<{ workspaces: Workspace[] }>('/workspaces').subscribe({
        next: (res) => {
          this.state.workspaces.set(res.workspaces);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
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
    if (!this.newWorkspaceName.trim() || this.isCreating()) return;

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
        this.router.navigate(['/dashboard/workspace', res.workspace.id]);
      },
      error: (err) => {
        this.isCreating.set(false);
        this.createError.set(err.error?.message || 'Failed to create workspace. Please try again.');
      }
    });
  }

  onLogout(): void {
    this.auth.logout();
  }
}
