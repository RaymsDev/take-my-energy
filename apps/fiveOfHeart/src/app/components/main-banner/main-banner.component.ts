import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SITE_CONFIG } from '../../configs';
import { AnalyticsService } from '../../services';

@Component({
  selector: 'app-main-banner',
  imports: [RouterModule],
  templateUrl: './main-banner.component.html',
  styleUrl: './main-banner.component.scss',
  providers: [AnalyticsService],
})
export class MainBannerComponent {
  public bookingUrl: string = SITE_CONFIG['BOOKING'];

  constructor(private analyticsService: AnalyticsService) {}

  onBookingClick(): void {
    this.analyticsService.trackEvent('booking', 'home-page');
  }
}
