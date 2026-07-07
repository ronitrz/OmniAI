// src/app/core/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string | null;
  profession?: string | null;
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

  register(fullName: string, email: string, password: string, otpCode: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', { fullName, email, password, otpCode }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  sendOtp(email: string): Observable<{ success: boolean; message: string; email?: string }> {
    return this.api.post<{ success: boolean; message: string; email?: string }>('/auth/send-otp', { email });
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

  updateProfile(fullName: string, profilePicture: string | null, profession: string | null = null): Observable<{ user: User }> {
    return this.api.put<{ user: User }>('/auth/profile', { fullName, profilePicture, profession }).pipe(
      tap((res: { user: User }) => this.currentUser.set(res.user))
    );
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>('/auth/password', { oldPassword, newPassword });
  }

  deleteAccount(): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>('/auth/account').pipe(
      tap(() => this.logout())
    );
  }

  logout(): void {
    localStorage.removeItem('omni_token');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('omni_token', res.token);
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }
}
