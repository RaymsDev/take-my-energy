import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { SITE_CONFIG } from '../../configs';

@Component({
  selector: 'app-footer',
  imports: [RouterModule, RecaptchaModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  siteConfig = SITE_CONFIG;
  socialLinks = [
    { label: 'Facebook', url: SITE_CONFIG['FACEBOOK'] },
    { label: 'LinkedIn', url: SITE_CONFIG['LINKEDIN'] },
    { label: 'Réservation', url: SITE_CONFIG['BOOKING'] },
  ];
  otherLinks = [
    { label: 'Mentions légales', url: '/legal-mentions' },
    { label: 'Politique de confidentialité', url: '/privacy-policy' },
    { label: 'Politique de cookies', url: '/cookies-policy' },
  ];
  contactDetails = {
    address: SITE_CONFIG['ADDRESS'],
    phone: SITE_CONFIG['PHONE'],
    email: SITE_CONFIG['EMAIL'],
  };
  currentYear: number = new Date().getFullYear();
  captchaVerified = false;
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  onCaptchaResolved(captchaResponse: string | null): void {
    if (captchaResponse) {
      this.captchaVerified = true;
    }
  }

  encodeAddress(address: string): string {
    return encodeURIComponent(address);
  }

  encodeToBase64(data: string): string {
    return btoa(data);
  }

  decodeFromBase64(encodedData: string): string {
    return atob(encodedData);
  }
}
