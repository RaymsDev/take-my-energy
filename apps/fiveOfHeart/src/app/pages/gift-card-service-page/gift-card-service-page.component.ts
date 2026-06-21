import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import { SITE_CONFIG } from '../../configs';
import { GiftCardsApiService } from '../../services/gift-cards-api.service';

@Component({
  selector: 'app-gift-card-service-page',
  templateUrl: './gift-card-service-page.component.html',
  styleUrls: ['./gift-card-service-page.component.scss'],
  imports: [],
})
export class GiftCardServicePageComponent implements OnInit {
  private readonly api = inject(GiftCardsApiService);
  private readonly route = inject(ActivatedRoute);

  service = signal<CatalogService | null>(null);
  loading = signal(true);
  error = signal(false);

  readonly bookingUrl = SITE_CONFIG['BOOKING'];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loading.set(false);
        this.error.set(true);
        return;
      }
      this.api.getServiceById(id).subscribe({
        next: (s) => {
          this.service.set(s);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
    });
  }
}
