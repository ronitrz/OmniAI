// src/app/features/auth/register/register.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <!-- Fixed Premium Top Navbar -->
      <nav class="auth-navbar glass">
        <div class="nav-container">
          <div class="logo-area" routerLink="/">
            <span class="logo-icon">⚖️</span>
            <span class="logo-text">OmniAI</span>
          </div>
          <div class="navbar-actions">
            <!-- Theme Toggle Button -->
            <button 
              class="theme-toggle-btn" 
              (click)="state.toggleTheme()" 
              type="button" 
              [title]="state.theme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              <span *ngIf="state.theme() === 'dark'">☀️</span>
              <span *ngIf="state.theme() === 'light'">🌙</span>
            </button>
            <a routerLink="/login" class="btn btn-secondary nav-btn">Log In</a>
          </div>
        </div>
      </nav>

      <div class="split-layout">
        <!-- Left Section: Premium SaaS Hero Showcase -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="version-tag">Consensus Engine v2.0</div>
            <h1 class="hero-title">
              Supercharge decisions with <span class="gradient-text">AI Consensus</span>
            </h1>
            <p class="hero-subtitle">
              Deploy GPT-4o, Gemini, Claude, and DeepSeek simultaneously. Analyze disagreements, isolate unique insights, and synthesize high-fidelity logic using our advanced Jury system.
            </p>

            <!-- Visual Dashboard Mockup -->
            <div class="hero-mockup glass animate-fade-in">
              <div class="mockup-header">
                <div class="window-dots">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                </div>
                <div class="mockup-title">Consensus Playground</div>
              </div>
              <div class="mockup-body">
                <div class="mockup-grid">
                  <div class="mockup-card gpt">
                    <div class="m-header">
                      <span class="avatar" style="background: linear-gradient(135deg, #10a37f 0%, #15803d 100%)">⁕</span>
                      <span class="model-name">GPT-4o</span>
                      <span class="m-latency">1.10s ⚡</span>
                    </div>
                    <div class="m-body">The capital of India is New Delhi.</div>
                  </div>
                  <div class="mockup-card gemini">
                    <div class="m-header">
                      <span class="avatar" style="background: linear-gradient(135deg, #4285f4 0%, #7c3aed 100%)">✦</span>
                      <span class="model-name">Gemini</span>
                      <span class="m-latency">0.85s ⚡</span>
                    </div>
                    <div class="m-body">New Delhi is the official capital city of India.</div>
                  </div>
                </div>
                
                <div class="mockup-verdict glass">
                  <div class="verdict-badge-row">
                    <span class="verdict-label">Jury Verdict</span>
                    <span class="verdict-confidence">98% High Agreement</span>
                  </div>
                  <p class="verdict-text">All selected models agree that New Delhi is the capital of India.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Auth Form -->
        <div class="auth-section">
          <div class="auth-card glass">
            <div class="auth-header">
              <h2 class="auth-title">Create Account</h2>
              <p class="auth-subtitle">Get started with OmniAI consensus platform</p>
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
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-primary);
      position: relative;
    }
    
    .auth-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 70px;
      z-index: 100;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border-light);
    }
    
    .nav-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      text-decoration: none;
    }
    
    .logo-icon {
      font-size: 1.5rem;
    }
    
    .logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    
    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .nav-btn {
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
      text-decoration: none;
    }
    
    .split-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      margin-top: 70px; /* offset navbar */
      min-height: calc(100vh - 70px);
    }
    
    @media (min-width: 1024px) {
      .split-layout {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }
    
    /* Hero Section */
    .hero-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      border-bottom: 1px solid var(--border-light);
    }
    
    @media (min-width: 1024px) {
      .hero-section {
        border-bottom: none;
        border-right: 1px solid var(--border-light);
        padding: 4rem;
      }
    }
    
    .hero-content {
      max-width: 580px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .version-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid var(--primary-glow);
      background-color: var(--primary-glow);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      width: fit-content;
    }
    
    .hero-title {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }
    
    @media (min-width: 640px) {
      .hero-title {
        font-size: 2.75rem;
      }
    }
    
    .gradient-text {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .hero-subtitle {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }
    
    /* Mockup Sandbox */
    .hero-mockup {
      border-radius: 12px;
      overflow: hidden;
      margin-top: 1rem;
      box-shadow: var(--shadow-glass);
      border: 1px solid var(--border-light);
    }
    
    .mockup-header {
      background-color: rgba(0, 0, 0, 0.15);
      padding: 0.625rem 1rem;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border-light);
    }
    
    .window-dots {
      display: flex;
      gap: 0.35rem;
    }
    
    .window-dots .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .window-dots .dot.red { background-color: #ef4444; }
    .window-dots .dot.yellow { background-color: #eab308; }
    .window-dots .dot.green { background-color: #22c55e; }
    
    .mockup-title {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-left: 1.5rem;
      letter-spacing: 0.05em;
    }
    
    .mockup-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .mockup-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    @media (min-width: 640px) {
      .mockup-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .mockup-card {
      background-color: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      padding: 0.75rem;
    }
    
    .m-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .m-header .avatar {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      color: #fff;
      font-weight: 700;
    }
    
    .m-header .model-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .m-header .m-latency {
      margin-left: auto;
      font-size: 0.625rem;
      color: var(--primary-hover);
      font-weight: 600;
    }
    
    .m-body {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    
    .mockup-verdict {
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
    
    .verdict-badge-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .verdict-label {
      color: var(--color-info);
    }
    
    .verdict-confidence {
      color: var(--color-success);
    }
    
    .verdict-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    
    /* Auth Form Section */
    .auth-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
    }
    
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: var(--shadow-glass);
      border: 1px solid var(--border-light);
    }
    
    .auth-header {
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .auth-title {
      font-size: 1.625rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }
    
    .auth-subtitle {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    
    .alert-error {
      background-color: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: var(--color-error);
    }
    
    .w-full {
      width: 100%;
      margin-top: 1rem;
    }
    
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    
    .auth-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
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
  protected state = inject(WorkspaceStateService);

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
