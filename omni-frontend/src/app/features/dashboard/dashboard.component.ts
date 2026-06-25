// src/app/features/dashboard/dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, LoginComponent, RegisterComponent],
  template: `
    <div class="dashboard-layout" [class.sidebar-open]="state.sidebarOpen()">
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

      <!-- Unified Auth Overlay Modal -->
      <div class="auth-overlay-backdrop animate-fade-in" *ngIf="state.authModalType() !== null" (click)="closeAuthModal()">
        <div class="auth-overlay-modal glass" (click)="$event.stopPropagation()">
          <button type="button" class="close-auth-overlay" (click)="closeAuthModal()">×</button>
          
          <app-login *ngIf="state.authModalType() === 'login'"></app-login>
          <app-register *ngIf="state.authModalType() === 'register'"></app-register>
        </div>
      </div>

      <div class="auth-overlay-backdrop confirm-overlay-backdrop animate-fade-in" *ngIf="state.confirmModal() as modal" (click)="modal.resolve(false)">
        <div class="auth-overlay-modal confirm-overlay-modal glass" (click)="$event.stopPropagation()">
          <div class="confirm-modal-content">
            <h3 class="confirm-modal-title">{{ modal.title }}</h3>
            <p class="confirm-modal-message">{{ modal.message }}</p>
            <div class="confirm-modal-actions">
              <button 
                *ngIf="modal.cancelText" 
                type="button" 
                class="btn-confirm-cancel" 
                (click)="modal.resolve(false)"
              >
                {{ modal.cancelText }}
              </button>
              <button 
                type="button" 
                class="btn-confirm-submit" 
                [class.type-danger]="modal.type === 'danger'"
                (click)="modal.resolve(true)"
              >
                {{ modal.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Overlay Modal -->
      <div class="auth-overlay-backdrop settings-overlay-backdrop animate-fade-in" *ngIf="state.settingsModalOpen()" (click)="state.settingsModalOpen.set(false)">
        <div class="auth-overlay-modal settings-overlay-modal glass" (click)="$event.stopPropagation()">
          <button type="button" class="close-auth-overlay" (click)="state.settingsModalOpen.set(false)">×</button>
          
          <div class="settings-container">
            <!-- Sidebar / Tab list -->
            <div class="settings-sidebar">
              <h2 class="settings-title">Settings</h2>
              <div class="settings-tabs">
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'general'" 
                  (click)="state.settingsActiveTab.set('general')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span class="tab-text">General</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'account'" 
                  (click)="state.settingsActiveTab.set('account')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span class="tab-text">Account</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'other'" 
                  (click)="state.settingsActiveTab.set('other')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span class="tab-text">Other</span>
                </button>
              </div>
            </div>

            <!-- Tab Content Area -->
            <div class="settings-content">
              <!-- General Tab -->
              <div *ngIf="state.settingsActiveTab() === 'general'" class="settings-tab-content animate-fade-in">
                <h3>General Settings</h3>
                <div class="settings-section">
                  <div class="setting-row">
                    <div class="setting-info">
                      <span class="setting-label">Theme Preference</span>
                      <span class="setting-desc">Switch between light and dark modes</span>
                    </div>
                    <button type="button" class="btn btn-secondary setting-action-btn" (click)="state.toggleTheme()">
                      Switch to {{ state.theme() === 'dark' ? 'Light' : 'Dark' }}
                    </button>
                  </div>
                  <div class="setting-row">
                    <div class="setting-info">
                      <span class="setting-label">Sidebar Position</span>
                      <span class="setting-desc">Toggle the navigation panel visible/hidden</span>
                    </div>
                    <button type="button" class="btn btn-secondary setting-action-btn" (click)="state.toggleSidebar()">
                      {{ state.sidebarOpen() ? 'Hide' : 'Show' }} Sidebar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Account Tab -->
              <div *ngIf="state.settingsActiveTab() === 'account'" class="settings-tab-content animate-fade-in">
                <h3>Account Settings</h3>
                <div class="settings-section" *ngIf="authService.currentUser() as user; else guestAccount">
                  <div class="user-profile-summary">
                    <div class="avatar-large">{{ user.fullName.slice(0, 2).toUpperCase() }}</div>
                    <div class="profile-details">
                      <h4 class="profile-name">{{ user.fullName }}</h4>
                      <span class="profile-role">Registered Member</span>
                    </div>
                  </div>
                  <div class="setting-row border-top">
                    <div class="setting-info">
                      <span class="setting-label">Email Address</span>
                      <span class="setting-desc">The primary email for this account</span>
                    </div>
                    <span class="setting-value">{{ user.email }}</span>
                  </div>
                  <div class="setting-row border-top">
                    <div class="setting-info">
                      <span class="setting-label">Phone Number</span>
                      <span class="setting-desc">Verified number for verification codes</span>
                    </div>
                    <span class="setting-value">{{ user.phoneNumber || 'Not registered' }}</span>
                  </div>
                </div>
                <ng-template #guestAccount>
                  <div class="guest-prompt-settings">
                    <h4>Logged in as Guest</h4>
                    <p>Log in or create a free account to unlock consensus histories, save chats, and configure settings.</p>
                    <button type="button" class="btn btn-primary" (click)="closeSettingsAndOpenLogin()">Log in</button>
                  </div>
                </ng-template>
              </div>

              <!-- Other Tab -->
              <div *ngIf="state.settingsActiveTab() === 'other'" class="settings-tab-content animate-fade-in">
                <h3>Other Options</h3>
                <div class="settings-section">
                  <div class="setting-row">
                    <div class="setting-info">
                      <span class="setting-label">Consensus Room Version</span>
                      <span class="setting-desc">Current production build release</span>
                    </div>
                    <span class="setting-value font-mono">v1.0.0</span>
                  </div>
                  <div class="setting-row">
                    <div class="setting-info">
                      <span class="setting-label">Database Sync Status</span>
                      <span class="setting-desc">Active Neon PostgreSQL instance connectivity</span>
                    </div>
                    <span class="setting-value status-online">● Connected</span>
                  </div>
                  <div class="setting-row border-top">
                    <div class="setting-info">
                      <span class="setting-label">Consensus Synths</span>
                      <span class="setting-desc">Active queries handled by the consensus engine</span>
                    </div>
                    <span class="setting-value font-mono">14 sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      position: relative;
    }
    .main-content {
      margin-left: 0;
      flex: 1;
      min-width: 0;
      background-color: var(--bg-primary);
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .dashboard-layout.sidebar-open .main-content {
      margin-left: var(--sidebar-width);
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
    
    /* Unified Auth Overlay Modal Styles */
    .auth-overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(3, 7, 18, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    .auth-overlay-modal {
      width: 95%;
      max-width: 420px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: 20px;
      padding: 1.5rem 1rem 2rem 1rem;
      position: relative;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      max-height: 90vh;
      overflow-y: auto;
      box-sizing: border-box;
    }
    .close-auth-overlay {
      position: absolute;
      top: 1.25rem;
      right: 1.5rem;
      background: none;
      border: none;
      font-size: 1.75rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s ease;
      line-height: 1;
      z-index: 10;
    }
    .close-auth-overlay:hover {
      color: var(--text-primary);
    }

    /* Confirm Modal Custom Overlay styles */
    .confirm-overlay-modal {
      max-width: 380px !important;
      padding: 2.25rem 2rem !important;
      text-align: center;
    }
    .confirm-modal-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .confirm-modal-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    .confirm-modal-title {
      font-size: 1.25rem;
      font-weight: 750;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .confirm-modal-message {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }
    .confirm-modal-actions {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      justify-content: center;
    }
    .btn-confirm-cancel, .btn-confirm-submit {
      flex: 1;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 650;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
    }
    .btn-confirm-submit {
      background-color: var(--primary);
      color: #ffffff;
    }
    .btn-confirm-submit:hover {
      background-color: var(--primary-hover);
    }
    .btn-confirm-submit.type-danger {
      background-color: #ef4444;
      color: #ffffff;
    }
    .btn-confirm-submit.type-danger:hover {
      background-color: #dc2626;
    }
    .btn-confirm-cancel {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      color: var(--text-primary);
    }
    .btn-confirm-cancel:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: var(--border-hover);
    }
    .light-theme .btn-confirm-cancel:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    /* Settings Overlay Styles */
    .settings-overlay-modal {
      max-width: 680px !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .settings-container {
      display: flex;
      height: 480px;
      background-color: var(--bg-secondary);
      border-radius: 20px;
    }
    .settings-sidebar {
      width: 200px;
      background-color: var(--bg-tertiary);
      border-right: 1px solid var(--border-light);
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .settings-title {
      font-size: 1.125rem;
      font-weight: 750;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      padding-left: 0.75rem;
      letter-spacing: -0.01em;
    }
    .settings-tabs {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .settings-tab-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    .settings-tab-btn:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.02);
    }
    .settings-tab-btn.active {
      color: var(--text-primary);
      background-color: var(--bg-tab-active, rgba(255, 255, 255, 0.06));
    }
    .settings-content {
      flex: 1;
      padding: 2.25rem 2.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .settings-tab-content h3 {
      font-size: 1.25rem;
      font-weight: 750;
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      letter-spacing: -0.01em;
    }
    .settings-section {
      display: flex;
      flex-direction: column;
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 0;
      gap: 1.5rem;
    }
    .setting-row.border-top {
      border-top: 1px solid var(--border-light);
    }
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .setting-label {
      font-size: 0.875rem;
      font-weight: 650;
      color: var(--text-primary);
    }
    .setting-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .setting-action-btn {
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
    }
    .setting-value {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .font-mono {
      font-family: var(--font-mono, SFMono-Regular, Consolas, monospace);
    }
    .status-online {
      color: #10b981;
      font-weight: 600;
    }
    .user-profile-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .avatar-large {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
      box-shadow: inset 0 1px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3);
    }
    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .profile-name {
      font-size: 1rem;
      font-weight: 750;
      color: var(--text-primary);
      margin: 0;
    }
    .profile-role {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .guest-prompt-settings {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 0;
      gap: 0.75rem;
    }
    .guest-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .guest-prompt-settings h4 {
      font-size: 1rem;
      font-weight: 750;
      color: var(--text-primary);
      margin: 0;
    }
    .guest-prompt-settings p {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      max-width: 280px;
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }
    
    @media (max-width: 640px) {
      .settings-container {
        flex-direction: column;
        height: auto;
        max-height: 80vh;
      }
      .settings-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-light);
        padding: 1.25rem 1.5rem;
      }
      .settings-tabs {
        flex-direction: row;
      }
      .settings-tab-btn {
        flex: 1;
        justify-content: center;
      }
      .settings-content {
        padding: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .sidebar-backdrop {
        display: block;
      }
      .dashboard-layout.sidebar-open .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);
  state = inject(WorkspaceStateService);

  ngOnInit(): void {
    // Attempt to load current user profile only if a token is present
    if (localStorage.getItem('omni_token')) {
      this.authService.loadCurrentUser().subscribe({
        error: () => this.authService.logout()
      });
    }

    // Set modal state if landing directly on login/register routes
    if (this.router.url.includes('/login')) {
      this.state.authModalType.set('login');
    } else if (this.router.url.includes('/register')) {
      this.state.authModalType.set('register');
    }
  }

  closeAuthModal(): void {
    this.state.authModalType.set(null);
    // If the browser URL currently shows /login or /register, redirect back to root /
    if (this.router.url.includes('/login') || this.router.url.includes('/register')) {
      this.router.navigate(['/']);
    }
  }

  closeSettingsAndOpenLogin(): void {
    this.state.settingsModalOpen.set(false);
    this.state.authModalType.set('login');
  }
}
