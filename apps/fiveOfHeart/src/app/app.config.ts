import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  provideGoogleAnalytics,
  provideGoogleAnalyticsRouter,
} from '@hakimio/ngx-google-analytics';
import { authInterceptorFn } from './interceptors/auth.interceptor';
import { routes } from './app.routes';
import { SITE_CONFIG } from './configs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptorFn])),
    provideGoogleAnalytics(SITE_CONFIG['GOOGLE_ANALYTICS_TAG']),
    provideGoogleAnalyticsRouter(),
  ],
};
