import { Component, inject, OnInit, signal, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { ApiService } from '../../core/services/api.service';
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

                    <div class="form-group mb-3">
                      <label class="setting-label">Phone Number</label>
                      <div class="setting-input-readonly-wrapper">
                        <div class="input-icon-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <input 
                          type="text" 
                          class="setting-input-readonly" 
                          [value]="user.phoneNumber || 'Not provided'" 
                          readonly 
                        />
                        <span class="badge-verified" *ngIf="user.phoneNumber">
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
                            <span class="history-session-date">{{ session.createdAt | date:'mediumDate' }} at {{ session.createdAt | date:'shortTime' }}</span>
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
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  state = inject(WorkspaceStateService);
  private zone = inject(NgZone);

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
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

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

  selectTab(tab: 'profile' | 'history' | 'project' | 'general'): void {
    this.state.settingsActiveTab.set(tab);
    if (tab === 'profile') {
      const user = this.authService.currentUser();
      if (user) {
        this.fullNameInput = user.fullName;
        this.selectedAvatar = user.profilePicture || null;
        this.professionInput = user.profession || '';
      }
    } else if (tab === 'history') {
      this.loadHistorySessions();
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
}
