// src/app/core/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Check if token exists in localStorage
  const hasToken = !!localStorage.getItem('omni_token');

  if (hasToken) {
    return true;
  }

  // Redirect to root chat page if not authenticated
  router.navigate(['/']);
  return false;
};
