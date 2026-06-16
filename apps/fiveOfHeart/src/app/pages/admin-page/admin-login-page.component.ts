import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss',
})
export class AdminLoginPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/gift-cards']);
    }
  }

  signIn(): void {
    this.authService.login();
  }
}
