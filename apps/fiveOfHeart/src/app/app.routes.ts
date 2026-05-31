import { Routes } from '@angular/router';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { HealthcarePageComponent } from './pages/healthcare-page/healthcare-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SessionPageComponent } from './pages/session-page/session-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'healthcare', component: HealthcarePageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'session', component: SessionPageComponent },
  {
    path: 'massage/:type',
    loadComponent: () =>
      import(
        './pages/massage-details-page/massage-details-page.component'
      ).then((m) => m.MassageDetailsPageComponent),
  },
  {
    path: 'office',
    loadComponent: () =>
      import('./pages/office-page/office-page.component').then(
        (m) => m.OfficePageComponent,
      ),
  },
  {
    path: 'legal-mentions',
    loadComponent: () =>
      import('./pages/legal-mentions-page/legal-mentions-page.component').then(
        (m) => m.LegalMentionsPageComponent,
      ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy-page/privacy-policy-page.component').then(
        (m) => m.PrivacyPolicyPageComponent,
      ),
  },
  {
    path: 'cookies-policy',
    loadComponent: () =>
      import('./pages/cookies-policy-page/cookies-policy-page.component').then(
        (m) => m.CookiesPolicyPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
