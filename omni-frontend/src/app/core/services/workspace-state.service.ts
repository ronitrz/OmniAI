// src/app/core/services/workspace-state.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Session } from '../../shared/models/session.model';
import { Workspace } from '../../shared/models/workspace.model';

export interface ConfirmModalState {
  title: string;
  message: string;
  type: 'danger' | 'info';
  confirmText: string;
  cancelText?: string;
  resolve: (val: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateService {
  private api = inject(ApiService);

  workspaces = signal<Workspace[]>([]);
  activeWorkspaceId = signal<string | null>(null);
  activeSessionId = signal<string | null>(null);
  sidebarSessions = signal<Session[]>([]);
  sidebarOpen = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  theme = signal<'dark' | 'light'>('dark');
  authModalType = signal<'login' | 'register' | null>(null);
  confirmModal = signal<ConfirmModalState | null>(null);
  settingsModalOpen = signal<boolean>(false);
  settingsActiveTab = signal<'profile' | 'history' | 'project' | 'general'>('profile');

  confirm(title: string, message: string, options?: { type?: 'danger' | 'info'; confirmText?: string; cancelText?: string }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmModal.set({
        title,
        message,
        type: options?.type || 'info',
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        resolve: (val: boolean) => {
          this.confirmModal.set(null);
          resolve(val);
        }
      });
    });
  }

  alert(title: string, message: string, options?: { type?: 'danger' | 'info'; confirmText?: string }): Promise<void> {
    return new Promise<void>((resolve) => {
      this.confirmModal.set({
        title,
        message,
        type: options?.type || 'info',
        confirmText: options?.confirmText || 'OK',
        resolve: () => {
          this.confirmModal.set(null);
          resolve();
        }
      });
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  initTheme(): void {
    const saved = localStorage.getItem('omni_theme') as 'dark' | 'light';
    if (saved) {
      this.theme.set(saved);
    } else {
      this.theme.set('dark');
    }
    this.applyTheme(this.theme());
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('omni_theme', next);
    this.applyTheme(next);
  }

  private applyTheme(t: 'dark' | 'light'): void {
    if (t === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }

  loadWorkspaces(): void {
    if (localStorage.getItem('omni_token')) {
      this.api.get<{ workspaces: Workspace[] }>('/workspaces').subscribe({
        next: (res) => this.workspaces.set(res.workspaces),
        error: () => {}
      });
    }
  }

  loadSidebarSessions(workspaceId: string): void {
    this.api.get<{ sessions: Session[] }>(`/workspaces/${workspaceId}/sessions`).subscribe({
      next: (res) => {
        // Only show up to 5 most recent sessions in sidebar
        this.sidebarSessions.set(res.sessions.slice(0, 5));
      },
      error: () => {}
    });
  }

  clear(): void {
    this.activeWorkspaceId.set(null);
    this.activeSessionId.set(null);
    this.sidebarSessions.set([]);
  }
}
