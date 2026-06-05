import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { SITE_CONFIG } from '../../configs';
import { AnalyticsService } from '../../services';

@Component({
  selector: 'app-burger-menu',
  imports: [RouterModule],
  templateUrl: './burger-menu.component.html',
  styleUrl: './burger-menu.component.scss',
  providers: [AnalyticsService],
})
export class BurgerMenuComponent implements OnInit {
  public bookingUrl: string = SITE_CONFIG['BOOKING'];
  isMenuOpen = false;
  isScrolled = false;
  private isHomePage = true;

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.checkRoute(this.router.url);

    if (this.router.events) {
      this.router.events
        .pipe(
          filter((e) => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((e: NavigationEnd) => {
          this.checkRoute(e.urlAfterRedirects);
          this.isMenuOpen = false;
          this.setBodyScroll(true);
        });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isHomePage && isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 60;
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.setBodyScroll(!this.isMenuOpen);
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.setBodyScroll(true);
  }

  onBookingClick(): void {
    this.analyticsService.trackEvent('booking', 'navbar');
    this.isMenuOpen = false;
    this.setBodyScroll(true);
  }

  private setBodyScroll(enabled: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = enabled ? '' : 'hidden';
    }
  }

  private checkRoute(url: string): void {
    this.isHomePage = url === '/' || url === '';
    if (!this.isHomePage) {
      this.isScrolled = true;
    } else if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 60;
    }
  }
}
