// src/app/features/auth/register/register.component.ts
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-box">
        <!-- Logo -->
        <div class="logo-wrapper">
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

        <h1 class="register-title">
          <span *ngIf="currentStep() === 'details'">Create your account</span>
          <span *ngIf="currentStep() === 'otp'">Verify phone number</span>
        </h1>

        <!-- Step 1 Form: Registration Details -->
        <form *ngIf="currentStep() === 'details'" (ngSubmit)="onSendOtp()" #detailsForm="ngForm" class="register-form">
          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <input
              type="text"
              id="fullName"
              name="fullName"
              class="input-field"
              [(ngModel)]="fullName"
              required
              placeholder="Full name"
              #nameInput="ngModel"
            />
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

          <div class="form-group password-field-wrapper">
            <input
              [type]="showPassword() ? 'text' : 'password'"
              id="password"
              name="password"
              class="input-field password-input-field"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="Password"
              #passwordInput="ngModel"
            />
            <button
              type="button"
              class="password-toggle-btn"
              (click)="showPassword.set(!showPassword())"
              [title]="showPassword() ? 'Hide password' : 'Show password'"
            >
              <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>

          <div class="form-group">
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              class="input-field"
              [(ngModel)]="phoneNumber"
              required
              placeholder="Phone number (e.g. +1234567890)"
              #phoneInput="ngModel"
            />
          </div>

          <button
            type="submit"
            class="btn-continue"
            [disabled]="detailsForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()">Sending code...</span>
            <span *ngIf="!isLoading()">Continue</span>
          </button>
        </form>

        <!-- Step 2 Form: OTP Code Entry -->
        <form *ngIf="currentStep() === 'otp'" (ngSubmit)="onSubmitRegister()" #otpForm="ngForm" class="register-form">
          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <div class="otp-instructions">
            We sent a 6-digit verification code to <strong>{{ phoneNumber }}</strong>. Enter the code below to complete registration.
          </div>

          <div class="form-group">
            <input
              type="text"
              id="otpCode"
              name="otpCode"
              class="input-field otp-input"
              [(ngModel)]="otpCode"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              placeholder="000000"
              #otpInput="ngModel"
              autocomplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            class="btn-continue"
            [disabled]="otpForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()">Verifying...</span>
            <span *ngIf="!isLoading()">Verify & Create Account</span>
          </button>

          <div class="resend-container">
            <span *ngIf="resendCountdown() > 0">
              Resend code in {{ resendCountdown() }}s
            </span>
            <button
              *ngIf="resendCountdown() === 0"
              type="button"
              class="btn-resend"
              (click)="onSendOtp()"
              [disabled]="isLoading()"
            >
              Resend code
            </button>
          </div>

          <div>
            <button type="button" class="btn-back" (click)="goBack()" [disabled]="isLoading()">
              ← Back to signup details
            </button>
          </div>
        </form>

        <!-- Only show Login prompt and Social options in Step 1 -->
        <ng-container *ngIf="currentStep() === 'details'">
          <div class="login-prompt">
            Already have an account?
            <button type="button" class="link-btn" (click)="switchToLogin($event)">Log in</button>
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
        </ng-container>
      </div>
  `,
  styles: [`
    .link-btn {
      background: none;
      border: none;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      padding: 0;
    }
    .link-btn:hover {
      text-decoration: underline;
    }



    .register-box {
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
    .logo-icon-svg-container {
      width: 32px;
      height: 32px;
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
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .register-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .register-form {
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

    .otp-input {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 1.625rem;
      letter-spacing: 0.4em;
      text-align: center;
      padding: 0.75rem;
      font-weight: 700;
      color: var(--primary);
    }

    .otp-instructions {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: -0.5rem;
      margin-bottom: 0.5rem;
      line-height: 1.5;
      text-align: left;
    }
    .otp-instructions strong {
      color: var(--text-primary);
    }

    .resend-container {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .btn-resend {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }
    .btn-resend:hover {
      text-decoration: underline;
      color: var(--primary-hover);
    }
    .btn-resend:disabled {
      color: var(--text-muted);
      cursor: not-allowed;
      text-decoration: none;
    }

    .btn-back {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-weight: 500;
      cursor: pointer;
      margin-top: 0.75rem;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }
    .btn-back:hover {
      color: var(--text-primary);
      text-decoration: underline;
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

    .login-prompt {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .link-login {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .link-login:hover {
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
  `]
})
export class RegisterComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected state = inject(WorkspaceStateService);

  fullName = '';
  email = '';
  password = '';
  showPassword = signal(false);
  phoneNumber = '';
  otpCode = '';

  currentStep = signal<'details' | 'otp'>('details');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  resendCountdown = signal(0);
  private timerInterval: any = null;

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onSendOtp(): void {
    if (!this.email || !this.phoneNumber) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.sendOtp(this.email, this.phoneNumber).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.currentStep.set('otp');
        this.otpCode = ''; // reset OTP code field
        this.startResendTimer();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to send verification code. Check email/phone number.');
      }
    });
  }

  switchToLogin(event: Event): void {
    event.preventDefault();
    this.state.authModalType.set('login');
  }

  onSubmitRegister(): void {
    if (!this.fullName || !this.email || !this.password || !this.phoneNumber || !this.otpCode) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(
      this.fullName,
      this.email,
      this.password,
      this.phoneNumber,
      this.otpCode
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.state.authModalType.set(null);
        this.state.loadWorkspaces();
        if (this.router.url.includes('/register')) {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Check verification code.');
      }
    });
  }

  goBack(): void {
    this.currentStep.set('details');
    this.errorMessage.set(null);
    this.clearResendTimer();
  }

  private startResendTimer(): void {
    this.clearResendTimer();
    this.resendCountdown.set(60);
    this.timerInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        this.clearResendTimer();
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.resendCountdown.set(0);
  }

  mockSocialLogin(provider: string): void {
    this.errorMessage.set(`${provider} signup is not configured. Please use your email and password to create an account.`);
  }
}
