import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GiftCard } from '@five-of-heart/shared/interfaces';
import { GiftCardsApiService } from '../../../../services/gift-cards-api.service';

@Component({
  selector: 'app-gift-cards-list-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './gift-cards-list-page.component.html',
  styleUrl: './gift-cards-list-page.component.scss',
})
export class GiftCardsListPageComponent implements OnInit {
  private readonly api = inject(GiftCardsApiService);
  private readonly route = inject(ActivatedRoute);

  cards = signal<GiftCard[]>([]);
  listError = signal<string | null>(null);
  redeeming = signal<Set<string>>(new Set());
  rowErrors = signal<Map<string, string>>(new Map());
  showBanner = signal(false);
  private bannerTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const created = this.route.snapshot.queryParams['created'];
    if (created === 'true') {
      this.showBanner.set(true);
      this.bannerTimer = setTimeout(() => this.showBanner.set(false), 5000);
    }

    this.api.listGiftCards().subscribe({
      next: (cards) => this.cards.set(cards),
      error: () =>
        this.listError.set('Failed to load gift cards. Please refresh.'),
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.bannerTimer);
  }

  dismissBanner(): void {
    this.showBanner.set(false);
    clearTimeout(this.bannerTimer);
  }

  isRedeeming(id: string): boolean {
    return this.redeeming().has(id);
  }

  redeem(card: GiftCard): void {
    const next = new Set(this.redeeming());
    next.add(card._id);
    this.redeeming.set(next);

    const errors = new Map(this.rowErrors());
    errors.delete(card._id);
    this.rowErrors.set(errors);

    this.api.redeemGiftCard(card._id).subscribe({
      next: (updated) => {
        this.cards.update((list) =>
          list.map((c) => (c._id === updated._id ? updated : c)),
        );
        const s = new Set(this.redeeming());
        s.delete(card._id);
        this.redeeming.set(s);
      },
      error: () => {
        const s = new Set(this.redeeming());
        s.delete(card._id);
        this.redeeming.set(s);

        const errs = new Map(this.rowErrors());
        errs.set(card._id, 'Redemption failed. Please try again.');
        this.rowErrors.set(errs);
      },
    });
  }

  rowError(id: string): string | undefined {
    return this.rowErrors().get(id);
  }

  truncateCode(code: string): string {
    return code.length > 8 ? code.slice(0, 8) + '…' : code;
  }
}
