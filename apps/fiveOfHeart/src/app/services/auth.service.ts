import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const hash = window.location.hash;
    if (hash.startsWith('#access_token=')) {
      const token = hash.slice('#access_token='.length);
      sessionStorage.setItem(TOKEN_KEY, token);
      history.replaceState(null, '', window.location.pathname);
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.location.href = '/api/auth/google';
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    this.router.navigate(['/admin/login']);
  }
}
