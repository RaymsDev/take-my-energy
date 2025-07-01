import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgxGoogleAnalyticsModule } from '@hakimio/ngx-google-analytics';
import { filter } from 'rxjs';
import { BurgerMenuComponent } from './components/burger-menu/burger-menu.component';
import { FooterComponent } from './components/footer/footer.component';
import { HealthcareService, JsonLdService } from './services';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxGoogleAnalyticsModule,
    FooterComponent,
    BurgerMenuComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [JsonLdService, HealthcareService],
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private jsonLdService: JsonLdService,
    private healthcareService: HealthcareService,
  ) {
    this.router.events
      .pipe(
        filter(
          (event) =>
            isPlatformBrowser(this.platformId) &&
            event instanceof NavigationEnd,
        ),
      )
      .subscribe(() => {
        this.document.defaultView?.scrollTo(0, 0);
      });
  }
  ngOnInit(): void {
    this.healthcareService.getJsonLDContent().subscribe((structuredData) => {
      this.jsonLdService.setStructuredData(structuredData);
    });
  }
}
