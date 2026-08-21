import { Component, inject, OnInit, signal, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { ApiService } from '../../core/services/api.service';
import { UserKeysService } from '../../core/services/user-keys.service';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, SidebarComponent, LoginComponent, RegisterComponent],
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
                  [class.active]="state.settingsActiveTab() === 'profile'" 
                  (click)="selectTab('profile')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span class="tab-text">Profile</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'history'" 
                  (click)="selectTab('history')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span class="tab-text">History</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'project'" 
                  (click)="selectTab('project')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span class="tab-text">Projects</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'general'" 
                  (click)="selectTab('general')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span class="tab-text">General</span>
                </button>
                <button 
                  type="button" 
                  class="settings-tab-btn api-keys-tab-btn" 
                  [class.active]="state.settingsActiveTab() === 'apikeys'" 
                  (click)="selectTab('apikeys')"
                >
                  <span class="api-keys-tab-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                    <span class="api-key-count-badge" *ngIf="userKeysService.hasAnyKey()">●</span>
                  </span>
                  <span class="tab-text">API Keys</span>
                </button>
              </div>
            </div>
 
            <!-- Tab Content Area -->
            <div class="settings-content">
              <!-- Profile Tab -->
              <div *ngIf="state.settingsActiveTab() === 'profile'" class="settings-tab-content animate-fade-in">
                <h3>My Profile</h3>
                <div class="settings-section" *ngIf="authService.currentUser() as user; else guestProfile">
                  <div class="user-profile-summary">
                    <div 
                      class="avatar-large" 
                      [style.backgroundImage]="getAvatarBackground(selectedAvatar)"
                      [class.has-image]="selectedAvatar && !selectedAvatar.startsWith('linear-gradient')"
                      (click)="fileInput.click()"
                      title="Upload profile picture"
                    >
                      <span *ngIf="!selectedAvatar || selectedAvatar.startsWith('linear-gradient')">
                        {{ user.fullName.slice(0, 2).toUpperCase() }}
                      </span>
                      <div class="avatar-hover-overlay">
                        <svg class="camera-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; margin-bottom: 0.15rem;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        <span>Change</span>
                      </div>
                    </div>
                    <div class="profile-details">
                      <div class="profile-title-badges">
                        <h4 class="profile-name">{{ user.fullName }}</h4>
                        <span class="badge-premium" *ngIf="user.profession">{{ professionLabels[user.profession] || capitalizeWord(user.profession) }}</span>
                      </div>
                      <div class="profile-meta-row">
                        <span class="profile-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px; margin-right: 4px; display: inline-block; vertical-align: middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          Joined {{ user.createdAt | date:'MMMM yyyy' }}
                        </span>
                      </div>
                      <div class="upload-actions">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="fileInput.click()">
                          Upload Photo
                        </button>
                        <button type="button" class="btn btn-danger-outline btn-sm" (click)="removeProfilePicture()" *ngIf="selectedAvatar">
                          Remove
                        </button>
                        <input 
                          #fileInput 
                          type="file" 
                          accept="image/*" 
                          style="display: none;" 
                          (change)="onFileSelected($event)"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Account Details Card -->
                  <div class="account-details-card">
                    <h4 class="settings-sub-title mb-3">Account Details</h4>
                    
                    <div class="form-group mb-3">
                      <label class="setting-label">Full Name</label>
                      <input 
                        type="text" 
                        class="setting-input-text" 
                        [(ngModel)]="fullNameInput" 
                        placeholder="e.g. Ronit Raj" 
                      />
                    </div>

                    <div class="form-group mb-3">
                      <label class="setting-label">Email Address</label>
                      <div class="setting-input-readonly-wrapper">
                        <div class="input-icon-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <input 
                          type="text" 
                          class="setting-input-readonly" 
                          [value]="user.email" 
                          readonly 
                        />
                        <span class="badge-verified">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 10px; height: 10px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Verified
                        </span>
                      </div>
                    </div>



                    <div class="form-group mb-0">
                      <label class="setting-label">I am a</label>
                      <div class="setting-input-readonly-wrapper">
                        <div class="input-icon-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <select 
                          class="setting-input-select" 
                          [(ngModel)]="professionInput"
                        >
                          <option value="" disabled selected>Select your role</option>
                          <option value="student">Student / Academic</option>
                          <option value="developer">Developer / Engineer</option>
                          <option value="businessman">Businessman / Entrepreneur</option>
                          <option value="researcher">Researcher / Analyst</option>
                          <option value="writer">Writer / Content Creator</option>
                          <option value="designer">Designer / Artist</option>
                          <option value="educator">Educator / Teacher</option>
                          <option value="hobbyist">Hobbyist / Explorer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div class="setting-actions-row mt-4" style="display: flex; align-items: center; gap: 1rem;">
                      <button type="button" class="btn btn-primary" (click)="saveProfile()">
                        Save Changes
                      </button>
                      <span class="inline-success-msg animate-fade-in" *ngIf="profileSaved()" style="color: #10b981; font-size: 0.8125rem; font-weight: 650; display: flex; align-items: center; gap: 4px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Saved successfully!
                      </span>
                    </div>
                  </div>

                  <!-- Password Management Card -->
                  <div class="password-card-container">
                    <h4 class="settings-sub-title mb-1">Security Credentials</h4>
                    <p class="setting-desc mb-4">Update your password regularly to keep your workspaces and integrations secure.</p>
                    
                    <div class="form-group mb-3">
                      <label class="setting-label">Current Password</label>
                      <div class="password-field-wrapper">
                        <input 
                          [type]="showOldPassword() ? 'text' : 'password'" 
                          class="setting-input-text password-input-field" 
                          [(ngModel)]="oldPasswordInput" 
                          placeholder="Enter current password" 
                        />
                        <button
                          type="button"
                          class="password-toggle-btn"
                          (click)="showOldPassword.set(!showOldPassword())"
                          [title]="showOldPassword() ? 'Hide password' : 'Show password'"
                        >
                          <svg *ngIf="showOldPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showOldPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label class="setting-label">New Password</label>
                      <div class="password-field-wrapper">
                        <input 
                          [type]="showNewPassword() ? 'text' : 'password'" 
                          class="setting-input-text password-input-field" 
                          [(ngModel)]="newPasswordInput" 
                          placeholder="At least 8 characters" 
                        />
                        <button
                          type="button"
                          class="password-toggle-btn"
                          (click)="showNewPassword.set(!showNewPassword())"
                          [title]="showNewPassword() ? 'Hide password' : 'Show password'"
                        >
                          <svg *ngIf="showNewPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showNewPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                      
                      <!-- Password Strength Meter -->
                      <div class="password-strength-meter-wrapper" *ngIf="newPasswordInput">
                        <div class="strength-meta">
                          <span class="strength-label-text">Password strength:</span>
                          <span class="strength-value-text" [ngClass]="getPasswordStrength().class">{{ getPasswordStrength().label }}</span>
                        </div>
                        <div class="strength-track">
                          <div class="strength-fill" [ngClass]="getPasswordStrength().class" [style.width.%]="getPasswordStrength().width"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="form-group mb-4">
                      <label class="setting-label">Confirm New Password</label>
                      <div class="password-field-wrapper">
                        <input 
                          [type]="showConfirmPassword() ? 'text' : 'password'" 
                          class="setting-input-text password-input-field" 
                          [(ngModel)]="confirmPasswordInput" 
                          placeholder="Retype new password" 
                        />
                        <button
                          type="button"
                          class="password-toggle-btn"
                          (click)="showConfirmPassword.set(!showConfirmPassword())"
                          [title]="showConfirmPassword() ? 'Hide password' : 'Show password'"
                        >
                          <svg *ngIf="showConfirmPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showConfirmPassword()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                    </div>
   
                    <div class="setting-actions-row" style="display: flex; align-items: center; gap: 1rem;">
                      <button type="button" class="btn btn-primary" (click)="changePassword()">
                        Update Password
                      </button>
                      <span class="inline-success-msg animate-fade-in" *ngIf="passwordUpdated()" style="color: #10b981; font-size: 0.8125rem; font-weight: 650; display: flex; align-items: center; gap: 4px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Password updated!
                      </span>
                    </div>
                  </div>

                  <!-- Session Section -->
                  <div class="session-section border-top pt-4 mt-4">
                    <h4 class="settings-sub-title">Session Settings</h4>
                    <div class="setting-row align-items-center">
                      <div class="setting-info">
                        <span class="setting-label">Log Out</span>
                        <span class="setting-desc">Sign out of your active session on this device.</span>
                      </div>
                      <button type="button" class="btn btn-secondary" (click)="logoutFromSettings()" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Sign Out
                      </button>
                    </div>
                  </div>

                  <!-- Danger Zone (Delete Account) -->
                  <div class="danger-zone-section border-top pt-4 mt-4">
                    <h4 class="settings-sub-title text-danger">Danger Zone</h4>
                    <div class="setting-row align-items-start">
                      <div class="setting-info">
                        <span class="setting-label text-danger">Delete Account</span>
                        <span class="setting-desc">Permanently remove this account and delete all workspaces, saved sessions, and messages. This is irreversible.</span>
                      </div>
                      <button type="button" class="btn btn-danger" (click)="deleteAccount()">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                <ng-template #guestProfile>
                  <div class="guest-prompt-settings">
                    <h4>Logged in as Guest</h4>
                    <p>Log in or create a free account to unlock consensus histories, save chats, and configure settings.</p>
                    <button type="button" class="btn btn-primary" (click)="closeSettingsAndOpenLogin()">Log in</button>
                  </div>
                </ng-template>
              </div>v>

              <!-- History Tab -->
              <div *ngIf="state.settingsActiveTab() === 'history'" class="settings-tab-content animate-fade-in">
                <h3>Chat History</h3>
                <div class="settings-section" *ngIf="authService.currentUser(); else guestHistory">
                  <!-- Search Filter -->
                  <div class="form-group mb-4">
                    <input 
                      type="text" 
                      class="setting-input-text search-icon-input" 
                      [(ngModel)]="historySearchQuery" 
                      placeholder="Search past conversations..." 
                    />
                  </div>

                  <!-- Structured History List -->
                  <div class="history-groups-container">
                    <div class="history-workspace-group" *ngFor="let group of getFilteredHistoryGroups()">
                      <div class="history-workspace-header">
                        <svg class="ws-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; margin-right: 0.4rem; color: var(--primary-hover);">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="history-workspace-name">{{ group.workspaceName }}</span>
                      </div>
                      <div class="history-sessions-list">
                        <div 
                          *ngFor="let session of group.sessions" 
                          class="history-session-item"
                          (click)="navigateToSession(session.id)"
                          title="Open conversation"
                        >
                          <div class="history-session-info">
                            <span class="history-session-title">{{ session.title }}</span>
                            <span class="history-session-date" [title]="session.createdAt | date:'medium'">{{ relativeTime(session.createdAt) }}</span>
                          </div>
                          <span class="history-item-arrow">→</span>
                        </div>
                      </div>
                    </div>

                    <div *ngIf="getFilteredHistoryGroups().length === 0" class="empty-history-state">
                      <span class="empty-icon">📂</span>
                      <p>No past conversations match your search query.</p>
                    </div>
                  </div>
                </div>

                <ng-template #guestHistory>
                  <div class="guest-prompt-settings">
                    <h4>Logged in as Guest</h4>
                    <p>Log in or create a free account to unlock consensus histories, save chats, and configure settings.</p>
                    <button type="button" class="btn btn-primary" (click)="closeSettingsAndOpenLogin()">Log in</button>
                  </div>
                </ng-template>
              </div>

              <!-- Projects Tab -->
              <div *ngIf="state.settingsActiveTab() === 'project'" class="settings-tab-content animate-fade-in">
                <h3>Projects & Workspaces</h3>
                <div class="settings-section" *ngIf="authService.currentUser(); else guestProject">
                  <!-- Create Project Inline -->
                  <div class="inline-create-box mb-4">
                    <h4 class="settings-sub-title">Create New Project</h4>
                    <div class="inline-form-row">
                      <input 
                        type="text" 
                        class="setting-input-text inline-input" 
                        [(ngModel)]="newProjectName" 
                        placeholder="Project Name (e.g. Java Placement)" 
                      />
                      <button 
                        type="button" 
                        class="btn btn-primary inline-btn"
                        [disabled]="!newProjectName.trim()"
                        (click)="createProjectInline()"
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  <!-- Workspaces List -->
                  <div class="projects-list-container">
                    <h4 class="settings-sub-title border-top pt-4">Active Projects</h4>
                    <div class="project-items-list">
                      <div *ngFor="let ws of state.workspaces()" class="project-settings-item">
                        <div class="project-meta">
                          <span class="project-title">{{ ws.name }}</span>
                          <span class="project-desc">{{ ws.description || 'No description provided' }}</span>
                        </div>
                        <button 
                          type="button" 
                          class="btn btn-danger-outline btn-sm"
                          (click)="deleteProject(ws.id)"
                        >
                          Delete
                        </button>
                      </div>

                      <div *ngIf="state.workspaces().length === 0" class="empty-projects-state">
                        <p>No active workspaces found. Create one above to get started.</p>
                      </div>
                  </div>
                </div>
              </div>

              <ng-template #guestProject>
                  <div class="guest-prompt-settings">
                    <h4>Logged in as Guest</h4>
                    <p>Log in or create a free account to unlock consensus histories, save chats, and configure settings.</p>
                    <button type="button" class="btn btn-primary" (click)="closeSettingsAndOpenLogin()">Log in</button>
                  </div>
                </ng-template>
              </div>

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
                </div>
              </div>

              <!-- API Keys Tab -->
              <div *ngIf="state.settingsActiveTab() === 'apikeys'" class="settings-tab-content animate-fade-in">
                <h3>API Keys</h3>

                <!-- Security notice -->
                <div class="apikeys-notice">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;flex-shrink:0;color:#a78bfa;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Keys are stored <strong>locally in your browser only</strong> — never sent to our servers. Models without a key fall back to Demo mode.</span>
                </div>

                <div class="api-provider-cards">

                  <!-- OpenAI -->
                  <div class="api-provider-card" [class.configured]="userKeysService.hasKey('openai')">
                    <div class="api-provider-card-header">
                      <div class="api-provider-brand">
                        <div class="api-provider-logo openai-logo">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
                        </div>
                        <div>
                          <span class="api-provider-name">OpenAI</span>
                          <span class="api-provider-model">GPT-5</span>
                        </div>
                      </div>
                      <span class="api-key-status-badge" [class.configured]="userKeysService.hasKey('openai')">
                        <svg *ngIf="userKeysService.hasKey('openai')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {{ userKeysService.hasKey('openai') ? 'Configured' : 'Not Set' }}
                      </span>
                    </div>
                    <div class="api-key-input-row">
                      <div class="password-field-wrapper" style="flex:1;">
                        <input [type]="showOpenAIKey() ? 'text' : 'password'" class="setting-input-text password-input-field" [(ngModel)]="openaiKeyInput" placeholder="sk-..." autocomplete="off"/>
                        <button type="button" class="password-toggle-btn" (click)="showOpenAIKey.set(!showOpenAIKey())">
                          <svg *ngIf="showOpenAIKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showOpenAIKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                      <button type="button" class="btn btn-primary btn-sm api-key-save-btn" (click)="saveApiKey('openai', openaiKeyInput)" [disabled]="!openaiKeyInput.trim()">Save</button>
                      <button type="button" class="btn btn-danger-outline btn-sm" (click)="clearApiKey('openai')" *ngIf="userKeysService.hasKey('openai')">Clear</button>
                    </div>
                    <div class="api-key-hint">Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com</a></div>
                  </div>

                  <!-- Gemini -->
                  <div class="api-provider-card" [class.configured]="userKeysService.hasKey('gemini')">
                    <div class="api-provider-card-header">
                      <div class="api-provider-brand">
                        <div class="api-provider-logo gemini-logo">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/></svg>
                        </div>
                        <div>
                          <span class="api-provider-name">Google</span>
                          <span class="api-provider-model">Gemini 3.5 Flash</span>
                        </div>
                      </div>
                      <span class="api-key-status-badge" [class.configured]="userKeysService.hasKey('gemini')">
                        <svg *ngIf="userKeysService.hasKey('gemini')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {{ userKeysService.hasKey('gemini') ? 'Configured' : 'Not Set' }}
                      </span>
                    </div>
                    <div class="api-key-input-row">
                      <div class="password-field-wrapper" style="flex:1;">
                        <input [type]="showGeminiKey() ? 'text' : 'password'" class="setting-input-text password-input-field" [(ngModel)]="geminiKeyInput" placeholder="AIza..." autocomplete="off"/>
                        <button type="button" class="password-toggle-btn" (click)="showGeminiKey.set(!showGeminiKey())">
                          <svg *ngIf="showGeminiKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showGeminiKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                      <button type="button" class="btn btn-primary btn-sm api-key-save-btn" (click)="saveApiKey('gemini', geminiKeyInput)" [disabled]="!geminiKeyInput.trim()">Save</button>
                      <button type="button" class="btn btn-danger-outline btn-sm" (click)="clearApiKey('gemini')" *ngIf="userKeysService.hasKey('gemini')">Clear</button>
                    </div>
                    <div class="api-key-hint">Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com</a></div>
                  </div>

                  <!-- Anthropic -->
                  <div class="api-provider-card" [class.configured]="userKeysService.hasKey('anthropic')">
                    <div class="api-provider-card-header">
                      <div class="api-provider-brand">
                        <div class="api-provider-logo anthropic-logo">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>
                        </div>
                        <div>
                          <span class="api-provider-name">Anthropic</span>
                          <span class="api-provider-model">Claude Sonnet 5</span>
                        </div>
                      </div>
                      <span class="api-key-status-badge" [class.configured]="userKeysService.hasKey('anthropic')">
                        <svg *ngIf="userKeysService.hasKey('anthropic')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {{ userKeysService.hasKey('anthropic') ? 'Configured' : 'Not Set' }}
                      </span>
                    </div>
                    <div class="api-key-input-row">
                      <div class="password-field-wrapper" style="flex:1;">
                        <input [type]="showAnthropicKey() ? 'text' : 'password'" class="setting-input-text password-input-field" [(ngModel)]="anthropicKeyInput" placeholder="sk-ant-..." autocomplete="off"/>
                        <button type="button" class="password-toggle-btn" (click)="showAnthropicKey.set(!showAnthropicKey())">
                          <svg *ngIf="showAnthropicKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showAnthropicKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                      <button type="button" class="btn btn-primary btn-sm api-key-save-btn" (click)="saveApiKey('anthropic', anthropicKeyInput)" [disabled]="!anthropicKeyInput.trim()">Save</button>
                      <button type="button" class="btn btn-danger-outline btn-sm" (click)="clearApiKey('anthropic')" *ngIf="userKeysService.hasKey('anthropic')">Clear</button>
                    </div>
                    <div class="api-key-hint">Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a></div>
                  </div>

                  <!-- DeepSeek -->
                  <div class="api-provider-card" [class.configured]="userKeysService.hasKey('deepseek')">
                    <div class="api-provider-card-header">
                      <div class="api-provider-brand">
                        <div class="api-provider-logo deepseek-logo">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/></svg>
                        </div>
                        <div>
                          <span class="api-provider-name">DeepSeek</span>
                          <span class="api-provider-model">DeepSeek R1</span>
                        </div>
                      </div>
                      <span class="api-key-status-badge" [class.configured]="userKeysService.hasKey('deepseek')">
                        <svg *ngIf="userKeysService.hasKey('deepseek')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {{ userKeysService.hasKey('deepseek') ? 'Configured' : 'Not Set' }}
                      </span>
                    </div>
                    <div class="api-key-input-row">
                      <div class="password-field-wrapper" style="flex:1;">
                        <input [type]="showDeepSeekKey() ? 'text' : 'password'" class="setting-input-text password-input-field" [(ngModel)]="deepseekKeyInput" placeholder="sk-..." autocomplete="off"/>
                        <button type="button" class="password-toggle-btn" (click)="showDeepSeekKey.set(!showDeepSeekKey())">
                          <svg *ngIf="showDeepSeekKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          <svg *ngIf="!showDeepSeekKey()" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                      <button type="button" class="btn btn-primary btn-sm api-key-save-btn" (click)="saveApiKey('deepseek', deepseekKeyInput)" [disabled]="!deepseekKeyInput.trim()">Save</button>
                      <button type="button" class="btn btn-danger-outline btn-sm" (click)="clearApiKey('deepseek')" *ngIf="userKeysService.hasKey('deepseek')">Clear</button>
                    </div>
                    <div class="api-key-hint">Get your key at <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">platform.deepseek.com</a></div>
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
      height: 560px;
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
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
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

    /* Custom Form & Settings Styling */
    .setting-input-text {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background-color: var(--bg-primary, #0a0c1a);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .setting-input-text:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1.25rem; }
    .pt-4 { padding-top: 1rem; }
    .mt-4 { margin-top: 1rem; }

    .settings-sub-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }
    .settings-sub-title.text-danger {
      color: #ef4444;
    }

    .btn-danger {
      background-color: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-danger:hover {
      background-color: #dc2626;
    }

    .btn-danger-outline {
      background: none;
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      border-radius: 6px;
      padding: 0.4rem 0.8rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-danger-outline:hover {
      background-color: rgba(239, 68, 68, 0.08);
      border-color: #ef4444;
    }

    /* Structured History styling */
    .history-groups-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-top: 0.5rem;
    }
    .history-workspace-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .history-workspace-header {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding-left: 0.25rem;
    }
    .history-sessions-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .history-session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: var(--bg-tertiary, #101226);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .history-session-item:hover {
      border-color: var(--primary);
      background-color: rgba(99, 102, 241, 0.03);
    }
    .history-session-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      flex: 1;
      padding-right: 1rem;
    }
    .history-session-title {
      font-size: 0.875rem;
      font-weight: 650;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .history-session-date {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .history-item-arrow {
      font-size: 1rem;
      color: var(--text-muted);
      transition: transform 0.2s ease, color 0.2s ease;
    }
    .history-session-item:hover .history-item-arrow {
      transform: translateX(3px);
      color: var(--primary-hover);
    }
    .empty-history-state, .empty-projects-state {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    /* Projects tab styling */
    .inline-create-box {
      background-color: var(--bg-tertiary, #101226);
      border: 1px solid var(--border-light);
      padding: 1.25rem;
      border-radius: 10px;
    }
    .inline-form-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .inline-input {
      flex: 1;
    }
    .inline-btn {
      flex-shrink: 0;
      padding: 0.5rem 1.25rem !important;
      font-size: 0.8125rem !important;
      border-radius: 8px !important;
    }
    .project-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .project-settings-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.25rem;
      background-color: var(--bg-tertiary, #101226);
      border: 1px solid var(--border-light);
      border-radius: 8px;
    }
    .project-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .project-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .project-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-sm {
      padding: 0.35rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
    .align-items-start {
      align-items: flex-start;
    }

    /* Interactive Avatar Uploader Styling */
    .avatar-large {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 700;
      cursor: pointer;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .avatar-large:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
    }
    .avatar-hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #ffffff;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .avatar-large:hover .avatar-hover-overlay {
      opacity: 1;
    }
    .upload-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    /* Password Input Absolute Toggles */
    .password-field-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .password-input-field {
      padding-right: 2.75rem !important;
    }
    .password-toggle-btn {
      position: absolute;
      right: 0.875rem;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }
    .password-toggle-btn:hover {
      color: var(--text-primary);
    }

    /* Upgraded Profile Styles */
    .profile-title-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge-premium {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
      color: var(--primary-hover);
      font-size: 0.65rem;
      font-weight: 750;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(139, 92, 246, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .profile-meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.2rem;
      margin-bottom: 0.5rem;
    }
    .profile-meta-item {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
    }
    .account-details-card {
      background-color: var(--bg-tertiary, #101226);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .setting-input-readonly-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .setting-input-readonly {
      width: 100%;
      padding: 0.65rem 0.85rem 0.65rem 2.25rem;
      background-color: rgba(0, 0, 0, 0.12);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      cursor: not-allowed;
    }
    .input-icon-left {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge-verified {
      position: absolute;
      right: 0.75rem;
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 20px;
      letter-spacing: 0.02em;
      border: 1px solid rgba(16, 185, 129, 0.15);
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .light-theme .setting-input-readonly {
      background-color: rgba(0, 0, 0, 0.03);
      color: var(--text-secondary);
    }
    .password-card-container {
      background-color: var(--bg-tertiary, #101226);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: border-color 0.2s ease;
    }
    .password-card-container:hover {
      border-color: var(--border-hover);
    }
    .password-strength-meter-wrapper {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .strength-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.725rem;
    }
    .strength-label-text {
      color: var(--text-muted);
    }
    .strength-value-text {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
    }
    .strength-value-text.weak { color: #ef4444; }
    .strength-value-text.medium { color: #f59e0b; }
    .strength-value-text.strong { color: #10b981; }
    
    .strength-track {
      height: 4px;
      background-color: rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      overflow: hidden;
      width: 100%;
    }
    .strength-fill {
      height: 100%;
      width: 0;
      border-radius: 10px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
    }
    .strength-fill.weak { background-color: #ef4444; }
    .strength-fill.medium { background-color: #f59e0b; }
    .strength-fill.strong { background-color: #10b981; }

    .setting-input-select {
      width: 100%;
      padding: 0.65rem 0.85rem 0.65rem 2.25rem;
      background-color: var(--bg-primary, #0a0c1a);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238892b0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.85rem center;
      background-size: 14px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .setting-input-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .light-theme .setting-input-select {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }

    /* ── API Keys Tab ─────────────────────────────────────────────── */
    .apikeys-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      background: rgba(167, 139, 250, 0.08);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: 10px;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .apikeys-notice strong { color: var(--text-primary); }
    .api-provider-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .api-provider-card {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 1rem 1.125rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .api-provider-card:hover {
      border-color: var(--border-hover);
    }
    .api-provider-card.configured {
      border-color: rgba(16, 185, 129, 0.35);
      box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.12);
    }
    .api-provider-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .api-provider-brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .api-provider-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .openai-logo { background: rgba(16, 163, 127, 0.15); color: #10a37f; }
    .gemini-logo { background: rgba(66, 133, 244, 0.15); color: #4285f4; }
    .anthropic-logo { background: rgba(201, 162, 39, 0.15); color: #c9a227; }
    .deepseek-logo { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .api-provider-name {
      display: block;
      font-size: 0.875rem;
      font-weight: 650;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .api-provider-model {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.2;
    }
    .api-key-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 650;
      background: rgba(255,255,255,0.04);
      color: var(--text-muted);
      border: 1px solid var(--border-light);
      transition: all 0.2s ease;
    }
    .api-key-status-badge.configured {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .api-key-input-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .api-key-save-btn {
      padding: 0.5rem 0.875rem !important;
      font-size: 0.8125rem !important;
      white-space: nowrap;
    }
    .api-key-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .api-key-hint a {
      color: var(--primary-hover);
      text-decoration: none;
    }
    .api-key-hint a:hover { text-decoration: underline; }
    .api-keys-tab-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .api-key-count-badge {
      position: absolute;
      top: -4px;
      right: -5px;
      color: #10b981;
      font-size: 8px;
      line-height: 1;
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  state = inject(WorkspaceStateService);
  private zone = inject(NgZone);
  userKeysService = inject(UserKeysService);

  // Profile fields
  fullNameInput = '';
  selectedAvatar: string | null = null;
  professionInput = '';
  profileSaved = signal(false);
  passwordUpdated = signal(false);
  
  professionLabels: Record<string, string> = {
    student: 'Student',
    developer: 'Developer',
    businessman: 'Businessman',
    researcher: 'Researcher',
    writer: 'Writer',
    designer: 'Designer',
    educator: 'Educator',
    hobbyist: 'Hobbyist',
    other: 'Other'
  };
  oldPasswordInput = '';
  newPasswordInput = '';
  confirmPasswordInput = '';

  // Password visibility toggles for password fields
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // API Keys tab
  openaiKeyInput = '';
  geminiKeyInput = '';
  anthropicKeyInput = '';
  deepseekKeyInput = '';
  showOpenAIKey = signal(false);
  showGeminiKey = signal(false);
  showAnthropicKey = signal(false);
  showDeepSeekKey = signal(false);

  constructor() {
    effect(() => {
      const activeTab = this.state.settingsActiveTab();
      const modalOpen = this.state.settingsModalOpen();
      
      if (modalOpen) {
        if (activeTab === 'history') {
          this.loadHistorySessions();
        } else if (activeTab === 'profile') {
          const user = this.authService.currentUser();
          if (user) {
            this.fullNameInput = user.fullName;
            this.selectedAvatar = user.profilePicture || null;
            this.professionInput = user.profession || '';
          }
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        // Crop to square
        let sx = 0;
        let sy = 0;
        let size = Math.min(width, height);
        sx = (width - size) / 2;
        sy = (height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          
          this.zone.run(() => {
            this.selectedAvatar = base64;
            // Immediate backend save
            this.authService.updateProfile(this.fullNameInput, base64, this.professionInput).subscribe({
              next: () => {},
              error: (err) => {
                this.state.alert('Error', err.error?.message || 'Failed to save profile picture');
              }
            });
          });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfilePicture(): void {
    this.zone.run(() => {
      this.selectedAvatar = null;
      // Immediate backend save
      this.authService.updateProfile(this.fullNameInput, null, this.professionInput).subscribe({
        next: () => {},
        error: (err) => {
          this.state.alert('Error', err.error?.message || 'Failed to remove profile picture');
        }
      });
    });
  }

  getAvatarBackground(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('linear-gradient')) {
      return avatar;
    }
    return `url("${avatar}")`;
  }

  getPasswordStrength(): { score: number; label: string; class: string; width: number } {
    const password = this.newPasswordInput;
    if (!password) {
      return { score: 0, label: 'Not Entered', class: 'neutral', width: 0 };
    }
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) {
      return { score, label: 'Weak', class: 'weak', width: 33 };
    } else if (score <= 4) {
      return { score, label: 'Medium', class: 'medium', width: 66 };
    } else {
      return { score, label: 'Strong', class: 'strong', width: 100 };
    }
  }

  logoutFromSettings(): void {
    this.state.settingsModalOpen.set(false);
    this.authService.logout();
  }

  // History fields
  historySearchQuery = '';
  historySessions = signal<Array<{ workspaceName: string; sessions: any[] }>>([]);

  // Project fields
  newProjectName = '';
  newProjectDesc = '';

  // Avatar presets
  avatarPresets = [
    'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo Ocean
    'linear-gradient(135deg, #ec4899, #f43f5e)', // Rose Blush
    'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald Dream
    'linear-gradient(135deg, #f59e0b, #e11d48)', // Sunset Blaze
    'linear-gradient(135deg, #8b5cf6, #ec4899)', // Purple Unicorn
    'linear-gradient(135deg, #3b82f6, #8b5cf6)', // Midnight Sky
  ];

  ngOnInit(): void {
    // Attempt to load current user profile only if a token is present
    if (localStorage.getItem('omni_token')) {
      this.authService.loadCurrentUser().subscribe({
        next: (res) => {
          this.fullNameInput = res.user.fullName;
          this.selectedAvatar = res.user.profilePicture || null;
          this.professionInput = res.user.profession || '';
        },
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

  selectTab(tab: 'profile' | 'history' | 'project' | 'general' | 'apikeys'): void {
    this.state.settingsActiveTab.set(tab);
    if (tab === 'profile') {
      const user = this.authService.currentUser();
      if (user) {
        this.fullNameInput = user.fullName;
        this.selectedAvatar = user.profilePicture || null;
        this.professionInput = user.profession || '';
      }
    }
  }

  saveProfile(): void {
    if (!this.fullNameInput.trim()) {
      this.state.alert('Error', 'Full name is required');
      return;
    }
    this.authService.updateProfile(this.fullNameInput, this.selectedAvatar, this.professionInput).subscribe({
      next: () => {
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 3000);
      },
      error: (err) => {
        this.state.alert('Error', err.error?.message || 'Failed to update profile');
      }
    });
  }

  capitalizeWord(word: string): string {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  changePassword(): void {
    if (!this.oldPasswordInput || !this.newPasswordInput) {
      this.state.alert('Error', 'Current password and new password are required');
      return;
    }
    if (this.newPasswordInput.length < 8) {
      this.state.alert('Error', 'New password must be at least 8 characters long');
      return;
    }
    if (this.newPasswordInput !== this.confirmPasswordInput) {
      this.state.alert('Error', 'New passwords do not match');
      return;
    }

    this.authService.updatePassword(this.oldPasswordInput, this.newPasswordInput).subscribe({
      next: () => {
        this.passwordUpdated.set(true);
        setTimeout(() => this.passwordUpdated.set(false), 3000);
        this.oldPasswordInput = '';
        this.newPasswordInput = '';
        this.confirmPasswordInput = '';
      },
      error: (err) => {
        this.state.alert('Error', err.error?.message || 'Failed to change password');
      }
    });
  }

  async deleteAccount(): Promise<void> {
    const confirm = await this.state.confirm(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action is permanent and will delete all your workspaces, chat history, and settings.',
      { type: 'danger', confirmText: 'Delete Permanently', cancelText: 'Cancel' }
    );

    if (confirm) {
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.state.settingsModalOpen.set(false);
          this.state.alert('Account Deleted', 'Your account has been deleted successfully.');
        },
        error: (err) => {
          this.state.alert('Error', err.error?.message || 'Failed to delete account');
        }
      });
    }
  }

  loadHistorySessions(): void {
    this.historySessions.set([]);
    const workspaces = this.state.workspaces();
    workspaces.forEach(ws => {
      this.api.get<{ sessions: any[] }>(`/workspaces/${ws.id}/sessions`).subscribe({
        next: (res) => {
          if (res.sessions.length > 0) {
            this.zone.run(() => {
              this.historySessions.update(list => [
                ...list,
                {
                  workspaceName: ws.name,
                  sessions: res.sessions
                }
              ]);
            });
          }
        }
      });
    });
  }

  getFilteredHistoryGroups() {
    const list = this.historySessions();
    if (!this.historySearchQuery.trim()) {
      return list;
    }
    const q = this.historySearchQuery.toLowerCase();
    return list.map(g => {
      const filtered = g.sessions.filter(s => s.title.toLowerCase().includes(q));
      return { ...g, sessions: filtered };
    }).filter(g => g.sessions.length > 0);
  }

  navigateToSession(sessionId: string): void {
    this.state.settingsModalOpen.set(false);
    this.router.navigate(['/session', sessionId]);
  }

  createProjectInline(): void {
    if (!this.newProjectName.trim()) return;
    this.api.post<{ workspace: any }>('/workspaces', {
      name: this.newProjectName,
      description: this.newProjectDesc
    }).subscribe({
      next: (res) => {
        this.state.workspaces.update(list => [...list, res.workspace]);
        this.newProjectName = '';
        this.newProjectDesc = '';
        this.state.alert('Success', 'Workspace created successfully');
      },
      error: (err) => {
        this.state.alert('Error', err.error?.message || 'Failed to create workspace');
      }
    });
  }

  async deleteProject(workspaceId: string): Promise<void> {
    const confirm = await this.state.confirm(
      'Delete Workspace',
      'Are you sure you want to delete this workspace and all its conversations?',
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (confirm) {
      this.api.delete(`/workspaces/${workspaceId}`).subscribe({
        next: () => {
          this.state.workspaces.update(list => list.filter(w => w.id !== workspaceId));
          this.state.alert('Deleted', 'Workspace deleted successfully.');
        },
        error: (err) => {
          this.state.alert('Error', err.error?.message || 'Failed to delete workspace');
        }
      });
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

  saveApiKey(provider: 'openai' | 'gemini' | 'anthropic' | 'deepseek', value: string): void {
    if (!value.trim()) return;
    this.userKeysService.setKey(provider, value.trim());
    // Clear the input after saving (write-once UX — key never shown again)
    switch (provider) {
      case 'openai': this.openaiKeyInput = ''; this.showOpenAIKey.set(false); break;
      case 'gemini': this.geminiKeyInput = ''; this.showGeminiKey.set(false); break;
      case 'anthropic': this.anthropicKeyInput = ''; this.showAnthropicKey.set(false); break;
      case 'deepseek': this.deepseekKeyInput = ''; this.showDeepSeekKey.set(false); break;
    }
  }

  clearApiKey(provider: 'openai' | 'gemini' | 'anthropic' | 'deepseek'): void {
    this.userKeysService.removeKey(provider);
  }

  relativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (diffDay < 365) {
      const months = Math.floor(diffDay / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.floor(diffDay / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}
