// src/app/features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <!-- Floating Theme Switcher -->
      <button 
        class="floating-theme-btn" 
        (click)="state.toggleTheme()" 
        type="button" 
        [title]="state.theme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <span *ngIf="state.theme() === 'dark'">☀️</span>
        <span *ngIf="state.theme() === 'light'">🌙</span>
      </button>

      <div class="login-box">
        <!-- Logo -->
        <div class="logo-wrapper">
          <span class="logo-icon">⚖️</span>
          <span class="logo-text">OmniAI</span>
        </div>

        <h1 class="login-title">Welcome back</h1>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <input
              type="email"
              id="email"
              name="email"
              class="input-field"
              [(ngModel)]="email"
              required
              email
              placeholder="Email address"
              #emailInput="ngModel"
            />
          </div>

          <div class="form-group">
            <input
              type="password"
              id="password"
              name="password"
              class="input-field"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="Password"
              #passwordInput="ngModel"
            />
          </div>

          <button
            type="submit"
            class="btn-continue"
            [disabled]="loginForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()">Loading...</span>
            <span *ngIf="!isLoading()">Continue</span>
          </button>
        </form>

        <div class="signup-prompt">
          Don't have an account?
          <a routerLink="/register" class="link-signup">Sign up</a>
        </div>

        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">OR</span>
          <span class="divider-line"></span>
        </div>

        <!-- Social Logins (Mocked to match ChatGPT style) -->
        <div class="social-logins">
          <button type="button" class="btn-social" (click)="mockSocialLogin('Google')">
            <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button type="button" class="btn-social" (click)="mockSocialLogin('Microsoft')">
            <svg class="social-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f35325" d="M0 0h11v11H0z"/>
              <path fill="#81bc06" d="M12 0h11v11H12z"/>
              <path fill="#05a6f0" d="M0 12h11v11H0z"/>
              <path fill="#ffba08" d="M12 12h11v11H12z"/>
            </svg>
            <span>Continue with Microsoft Account</span>
          </button>

          <button type="button" class="btn-social" (click)="mockSocialLogin('Apple')">
            <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94.1.08.2.1.32.1 1.04-.03 2.14-.62 2.49-1.43z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .floating-theme-btn {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: none;
      border: 1px solid var(--border-light);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: var(--text-primary);
      font-size: 1.125rem;
    }
    .floating-theme-btn:hover {
      background-color: var(--bg-secondary);
      border-color: var(--border-hover);
    }

    .login-box {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2.5rem;
    }
    .logo-icon {
      font-size: 2.25rem;
    }
    .logo-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .login-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      width: 100%;
    }

    .input-field {
      width: 100%;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.9375rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .input-field:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }

    .btn-continue {
      width: 100%;
      padding: 0.875rem;
      border-radius: 8px;
      border: none;
      background-color: var(--primary);
      color: #ffffff;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-top: 0.5rem;
    }
    .btn-continue:hover {
      background-color: var(--primary-hover);
    }
    .btn-continue:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .signup-prompt {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .link-signup {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .link-signup:hover {
      text-decoration: underline;
    }

    .divider {
      width: 100%;
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
      gap: 0.75rem;
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background-color: var(--border-light);
    }
    .divider-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .social-logins {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-social {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.75rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .btn-social:hover {
      background-color: var(--bg-tertiary);
      border-color: var(--border-hover);
    }

    .social-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      text-align: left;
    }
    .alert-error {
      background-color: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: var(--color-error);
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected state = inject(WorkspaceStateService);

  email = '';
  password = '';
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to login. Please check credentials.');
      }
    });
  }

  mockSocialLogin(provider: string): void {
    this.errorMessage.set(`${provider} login is not configured. Please use your email and password to log in.`);
  }
}
