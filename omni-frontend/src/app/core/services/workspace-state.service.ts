// src/app/core/services/workspace-state.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Session } from '../../shared/models/session.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateService {
  private api = inject(ApiService);

  activeWorkspaceId = signal<string | null>(null);
  activeSessionId = signal<string | null>(null);
  sidebarSessions = signal<Session[]>([]);

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
