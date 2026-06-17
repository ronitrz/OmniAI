// src/app/features/auth/register/register.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container animate-fade-in">
      <div class="auth-card glass">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Get started with OmniAI multi-consensus platform</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label class="form-label" for="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              class="input-field"
              [(ngModel)]="fullName"
              required
              placeholder="John Doe"
              #nameInput="ngModel"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              class="input-field"
              [(ngModel)]="email"
              required
              email
              placeholder="you@example.com"
              #emailInput="ngModel"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              class="input-field"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="••••••••"
              #passwordInput="ngModel"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            [disabled]="registerForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()">Creating account...</span>
            <span *ngIf="!isLoading()">Register</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Already have an account?
            <a routerLink="/login" class="auth-link">Log in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      background-color: var(--bg-primary);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      border-radius: 16px;
    }
    .auth-header {
      margin-bottom: 2rem;
      text-align: center;
    }
    .auth-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .alert-error {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-error);
    }
    .w-full {
      width: 100%;
      margin-top: 1rem;
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .auth-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }
    .auth-link:hover {
      color: var(--primary-hover);
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.fullName, this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Try a different email.');
      }
    });
  }
}
