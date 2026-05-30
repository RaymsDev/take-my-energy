import { Inject, Injectable } from '@angular/core';
import { GoogleAnalyticsService } from '@hakimio/ngx-google-analytics';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(GoogleAnalyticsService)
    private readonly gaService: GoogleAnalyticsService,
  ) {}
  trackEvent(eventName: string, eventCategory: string, value?: number): void {
    this.gaService.event('event', {
      label: eventName,
      category: eventCategory,
      value,
    });
  }
}
