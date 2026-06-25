// src/app/core/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  createdAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // State Signals
  currentUser = signal<User | null>(null);
  token = signal<string | null>(localStorage.getItem('omni_token'));

  // Computed state
  isLoggedIn = computed(() => !!this.token() && !!this.currentUser());

  constructor() {
    // If we have a token stored but no user, try to load the user profile
    if (this.token()) {
      this.loadCurrentUser().subscribe({
        error: () => this.logout() // clear token if it's expired/invalid
      });
    }
  }

  register(fullName: string, email: string, password: string, phoneNumber: string, otpCode: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', { fullName, email, password, phoneNumber, otpCode }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  sendOtp(email: string, phoneNumber: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/send-otp', { email, phoneNumber });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  loadCurrentUser(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/auth/me').pipe(
      tap(res => this.currentUser.set(res.user))
    );
  }

  logout(): void {
    localStorage.removeItem('omni_token');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('omni_token', res.token);
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }
}
