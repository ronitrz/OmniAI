// src/app/features/dashboard/dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar Backdrop for Mobile -->
      <div 
        class="sidebar-backdrop animate-fade-in" 
        *ngIf="state.sidebarOpen()" 
        (click)="state.sidebarOpen.set(false)"
      ></div>

      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      position: relative;
    }
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-width: 0;
      background-color: var(--bg-primary);
      transition: margin-left 0.3s ease-in-out;
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 99;
    }
    @media (max-width: 768px) {
      .sidebar-backdrop {
        display: block;
      }
      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  state = inject(WorkspaceStateService);

  ngOnInit(): void {
    // Attempt to load current user profile to verify auth state fully
    this.authService.loadCurrentUser().subscribe({
      error: () => this.authService.logout()
    });
  }
}
