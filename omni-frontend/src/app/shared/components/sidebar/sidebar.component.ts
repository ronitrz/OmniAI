// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
        <div class="logo-area" routerLink="/" (click)="state.clear(); state.sidebarOpen.set(false)">
          <span class="logo-icon-svg-container">
            <svg class="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L2 20H22L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" stroke-width="1.5" fill="var(--bg-secondary)"/>
              <circle cx="12" cy="13.5" r="1.5" fill="currentColor"/>
              <path d="M7.5 13.5C8.8 11.2 11.2 10.5 12 10.5C12.8 10.5 15.2 11.2 16.5 13.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M7.5 13.5C8.8 15.8 11.2 16.5 12 16.5C12.8 16.5 15.2 15.8 16.5 13.5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </span>
          <span class="logo-text">OmniAI</span>
        </div>
        <button class="close-sidebar-btn" (click)="state.sidebarOpen.set(false)" title="Close Menu">×</button>
      </div>

      <div class="sidebar-content">
        <!-- Sidebar KPI Metrics Panel -->
        <div class="sidebar-stats-panel glass" *ngIf="auth.currentUser() && state.workspaces().length > 0">
          <div class="stat-col">
            <span class="stat-num">{{ state.workspaces().length }}</span>
            <span class="stat-lbl">Workspaces</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-col">
            <span class="stat-num">{{ getTotalSessionsCount() }}</span>
            <span class="stat-lbl">Debates</span>
          </div>
        </div>

        <ng-container *ngIf="auth.currentUser()">
          <div class="section-title">
            <span>WORKSPACES</span>
            <button class="add-btn" (click)="openCreateModal()" title="New Workspace">+</button>
          </div>

          <div class="workspace-list" *ngIf="!isLoading(); else loadingShimmer">
            <div *ngFor="let ws of state.workspaces()" class="workspace-item-container animate-fade-in">
              <div
                class="workspace-item"
                [routerLink]="['/workspace', ws.id]"
                [class.active]="state.activeWorkspaceId() === ws.id"
                (click)="state.sidebarOpen.set(false)"
              >
                <svg class="ws-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="ws-name">{{ ws.name }}</span>
              </div>
              
              <!-- Conversations Sublist -->
              <div class="session-sublist animate-fade-in" *ngIf="state.activeWorkspaceId() === ws.id">
                <div
                  *ngFor="let session of state.sidebarSessions()"
                  class="session-subitem"
                  [routerLink]="['/session', session.id]"
                  [class.sub-active]="state.activeSessionId() === session.id"
                  (click)="state.sidebarOpen.set(false)"
                >
                  <svg class="session-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; flex-shrink: 0;">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
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
        </ng-container>

        <!-- Guest Sidebar Prompt -->
        <div class="guest-sidebar-prompt animate-fade-in" *ngIf="!auth.currentUser()">
          <h4>Create workspaces</h4>
          <p>Sign up or log in to customize workspaces, create multiple sessions, and save your chat history.</p>
        </div>

        <ng-template #loadingShimmer>
          <div class="workspace-loading-shimmer">
            <div class="shimmer loading-item" *ngFor="let i of [1, 2, 3]"></div>
          </div>
        </ng-template>
      </div>

      <div class="sidebar-footer">
        <!-- Logged In Footer Profile -->
        <ng-container *ngIf="auth.currentUser() as user">
          <!-- Floating Profile Dropdown Menu -->
          <div class="profile-dropdown animate-fade-in" *ngIf="profileMenuOpen()">            <div class="dropdown-header">
              <span 
                class="avatar-small" 
                [style.backgroundImage]="getAvatarBackground(user.profilePicture)"
                [class.has-image]="user.profilePicture && !user.profilePicture.startsWith('linear-gradient')"
              >
                <span *ngIf="!user.profilePicture || user.profilePicture.startsWith('linear-gradient')">
                  {{ user.fullName.slice(0, 2).toUpperCase() }}
                </span>
              </span>
              <div class="header-details">
                <span class="dropdown-user-name">{{ user.fullName }}</span>
                <span class="dropdown-user-email">{{ user.email }}</span>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <button class="dropdown-item" (click)="state.toggleTheme(); $event.stopPropagation()" type="button">
              <svg *ngIf="state.theme() === 'dark'" class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg *ngIf="state.theme() !== 'dark'" class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span class="item-text">Switch to {{ state.theme() === 'dark' ? 'Light' : 'Dark' }}</span>
            </button>
            
            <button class="dropdown-item" (click)="showMockSettings(); $event.stopPropagation()" type="button">
              <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="item-text">My Profile</span>
            </button>
            
            <button class="dropdown-item" (click)="showMockAnalytics(); $event.stopPropagation()" type="button">
              <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span class="item-text">Chat History</span>
            </button>
            
            <div class="dropdown-divider"></div>
            
            <button class="dropdown-item logout-item" (click)="onLogout(); $event.stopPropagation()" type="button">
              <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span class="item-text">Log Out</span>
            </button>
          </div>
 
          <button class="profile-trigger-btn" (click)="toggleProfileMenu($event)" type="button">
            <div 
              class="user-avatar" 
              [style.backgroundImage]="getAvatarBackground(user.profilePicture)"
              [class.has-image]="user.profilePicture && !user.profilePicture.startsWith('linear-gradient')"
            >
              <span *ngIf="!user.profilePicture || user.profilePicture.startsWith('linear-gradient')">
                {{ user.fullName.slice(0, 2).toUpperCase() }}
              </span>
            </div>
            <div class="user-details">
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-email">{{ user.email }}</div>
            </div>
            <span class="chevron-icon">▲</span>
          </button>
        </ng-container>

        <!-- Logged Out (Guest) Footer Auth Buttons -->
        <ng-container *ngIf="!auth.currentUser()">
          <div class="auth-buttons-container">
            <button type="button" class="btn-sidebar-signup" (click)="state.authModalType.set('register')">Sign up</button>
            <button type="button" class="btn-sidebar-login" (click)="state.authModalType.set('login')">Log in</button>
          </div>
        </ng-container>
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
              placeholder="e.g., DSA and System Design prep"
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
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(-100%);
    }
    .sidebar.open {
      transform: translateX(0);
    }
    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height);
    }
    .close-sidebar-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-muted);
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
    .logo-icon-svg-container {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--text-primary) 30%, var(--text-muted) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sidebar-content {
      flex: 1;
      padding: 1.5rem 1rem;
      overflow-y: auto;
    }
    
    /* Stats panel */
    .sidebar-stats-panel {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0.75rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      background-color: rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-light);
    }
    .stat-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stat-num {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }
    .stat-lbl {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }
    .stat-divider {
      width: 1px;
      height: 20px;
      background-color: var(--border-light);
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      margin-bottom: 0.75rem;
      padding: 0 0.5rem;
    }
    .add-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      font-weight: 300;
      cursor: pointer;
      line-height: 1;
      transition: color 0.2s;
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
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 3px solid transparent;
    }
    .workspace-item:hover {
      background-color: rgba(255, 255, 255, 0.02);
      color: var(--text-primary);
    }
    .workspace-item.active {
      background: linear-gradient(to right, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.01) 100%);
      color: var(--primary-hover);
      font-weight: 600;
      border-left-color: var(--primary);
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
      padding-left: 1.5rem;
      margin: 0.25rem 0 0.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      border-left: 1px solid var(--border-light);
      margin-left: 1.125rem;
    }
    .session-subitem {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.625rem;
      border-radius: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 2px solid transparent;
    }
    .session-subitem:hover {
      background-color: rgba(255, 255, 255, 0.02);
      color: var(--text-primary);
    }
    .session-subitem.sub-active {
      color: var(--primary-hover);
      font-weight: 600;
      background-color: rgba(99, 102, 241, 0.04);
      border-left-color: var(--primary);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding-left: calc(0.625rem - 2px);
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
      color: var(--text-dim);
      padding: 0.25rem 0.625rem;
    }

    .empty-state {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-align: center;
      padding: 1rem 0;
    }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      position: relative;
      background-color: rgba(0, 0, 0, 0.15);
    }
    .auth-buttons-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }
    .btn-sidebar-login, .btn-sidebar-signup {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      box-sizing: border-box;
      border: none;
    }
    .btn-sidebar-login {
      background: none;
      border: 1px solid var(--border-light);
      color: var(--text-primary);
    }
    .btn-sidebar-login:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: var(--border-hover);
    }
    .btn-sidebar-signup {
      background-color: var(--primary);
      color: #ffffff;
    }
    .btn-sidebar-signup:hover {
      background-color: var(--primary-hover);
    }
    .guest-sidebar-prompt {
      padding: 1.25rem 1rem;
      border-radius: 12px;
      background-color: rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-light);
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .guest-sidebar-prompt .prompt-icon {
      font-size: 1.75rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .guest-sidebar-prompt h4 {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .guest-sidebar-prompt p {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin: 0;
    }
    .profile-trigger-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: none;
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 0.5rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      color: inherit;
    }
    .profile-trigger-btn:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: var(--border-light);
    }
    .light-theme .profile-trigger-btn:hover {
      background-color: rgba(0, 0, 0, 0.02);
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
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .user-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
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
    .chevron-icon {
      font-size: 0.625rem;
      color: var(--text-muted);
      margin-left: auto;
      transition: color 0.2s ease;
    }
    .profile-trigger-btn:hover .chevron-icon {
      color: var(--text-primary);
    }
    
    /* Popover menu styles */
    .profile-dropdown {
      position: absolute;
      bottom: 75px;
      left: 1rem;
      right: 1rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 0.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 150;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .light-theme .profile-dropdown {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    }
    
    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }
    .avatar-small {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .header-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .dropdown-user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-user-email {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .dropdown-divider {
      height: 1px;
      background-color: var(--border-light);
      margin: 0.25rem 0;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: none;
      border: none;
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.04);
      color: var(--text-primary);
    }
    .light-theme .dropdown-item:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    .logout-item:hover {
      background-color: rgba(239, 68, 68, 0.08);
      color: var(--color-error);
    }
    .item-icon {
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      backdrop-filter: blur(4px);
    }
    .modal {
      width: 90%;
      max-width: 460px;
      padding: 2rem;
      border-radius: 16px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
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
      background-color: rgba(244, 63, 94, 0.05);
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
  
  profileMenuOpen = signal(false);

  newWorkspaceName = '';
  newWorkspaceDesc = '';

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  showMockSettings(): void {
    this.state.settingsActiveTab.set('profile');
    this.state.settingsModalOpen.set(true);
  }

  showMockAnalytics(): void {
    this.state.settingsActiveTab.set('history');
    this.state.settingsModalOpen.set(true);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.profileMenuOpen.set(false);
  }

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

  getAvatarBackground(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('linear-gradient')) {
      return avatar;
    }
    return `url("${avatar}")`;
  }

  getAvatarUrl(avatar: string | null | undefined): string | null {
    if (!avatar || avatar.startsWith('linear-gradient')) return null;
    return `url("${avatar}")`;
  }

  getTotalSessionsCount(): number {
    return this.state.workspaces().reduce((sum, ws) => sum + (ws._count?.sessions || 0), 0);
  }
}
