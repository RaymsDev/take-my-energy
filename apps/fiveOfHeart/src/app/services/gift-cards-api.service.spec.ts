import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GiftCard } from '@five-of-heart/shared/interfaces';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import type { CreateGiftCardInput } from '@five-of-heart/shared/dto';
import { GiftCardsApiService } from './gift-cards-api.service';

const mockCard = (): GiftCard => ({
  _id: 'card-1',
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
  serviceName: 'Massage',
  servicePrice: 80,
  code: 'ABC123',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockCatalogItem = (): CatalogService => ({
  id: 'svc-1',
  title: 'Deep Tissue',
  price: 80,
  currency: 'EUR',
  duration: { value: 60, unitText: 'min' },
});

describe('GiftCardsApiService', () => {
  let service: GiftCardsApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GiftCardsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GiftCardsApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('getCatalog() makes GET /api/catalog and returns CatalogService[]', () => {
    const catalog = [mockCatalogItem()];
    service.getCatalog().subscribe((res) => expect(res).toEqual(catalog));
    controller.expectOne('/api/catalog').flush(catalog);
  });

  it('createGiftCard() makes POST /api/gift-cards with the DTO', () => {
    const dto: CreateGiftCardInput = {
      recipientName: 'Alice',
      recipientEmail: 'alice@example.com',
      senderName: 'Bob',
      serviceId: 'svc-1',
    };
    const card = mockCard();
    service.createGiftCard(dto).subscribe((res) => expect(res).toEqual(card));
    const req = controller.expectOne('/api/gift-cards');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(card);
  });

  it('listGiftCards() makes GET /api/gift-cards and returns GiftCard[]', () => {
    const cards = [mockCard()];
    service.listGiftCards().subscribe((res) => expect(res).toEqual(cards));
    controller.expectOne('/api/gift-cards').flush(cards);
  });

  it('redeemGiftCard() makes PATCH /api/gift-cards/:id/redeem', () => {
    const updated = { ...mockCard(), status: 'redeemed' as const };
    service
      .redeemGiftCard('card-1')
      .subscribe((res) => expect(res).toEqual(updated));
    const req = controller.expectOne('/api/gift-cards/card-1/redeem');
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);
  });
});
