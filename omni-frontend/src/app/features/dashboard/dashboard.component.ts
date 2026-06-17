// src/app/features/dashboard/dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="dashboard-layout">
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
    }
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-width: 0;
      background-color: var(--bg-primary);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Attempt to load current user profile to verify auth state fully
    this.authService.loadCurrentUser().subscribe({
      error: () => this.authService.logout()
    });
  }
}
