import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SITE_CONFIG } from '../../configs';
import { AnalyticsService } from '../../services';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-burger-menu',
  imports: [CommonModule, RouterModule],
  templateUrl: './burger-menu.component.html',
  styleUrl: './burger-menu.component.scss',
  providers: [AnalyticsService],
})
export class BurgerMenuComponent {
  public bookingUrl: string = SITE_CONFIG['BOOKING'];
  isMenuOpen = false;

  constructor(private analyticsService: AnalyticsService) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onBookingClick(): void {
    this.analyticsService.trackEvent('booking', 'navbar');
    this.isMenuOpen = false;
  }
}
