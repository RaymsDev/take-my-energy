import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GiftCard } from '@five-of-heart/shared/interfaces';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import type { CreateGiftCardInput } from '@five-of-heart/shared/dto';

@Injectable({ providedIn: 'root' })
export class GiftCardsApiService {
  private readonly http = inject(HttpClient);

  getCatalog(): Observable<CatalogService[]> {
    return this.http.get<CatalogService[]>('/api/catalog');
  }

  getServiceById(id: string): Observable<CatalogService> {
    return this.http.get<CatalogService>(`/api/catalog/${id}`);
  }

  createGiftCard(dto: CreateGiftCardInput): Observable<GiftCard> {
    return this.http.post<GiftCard>('/api/gift-cards', dto);
  }

  listGiftCards(): Observable<GiftCard[]> {
    return this.http.get<GiftCard[]>('/api/gift-cards');
  }

  redeemGiftCard(id: string): Observable<GiftCard> {
    return this.http.patch<GiftCard>(`/api/gift-cards/${id}/redeem`, {});
  }
}
