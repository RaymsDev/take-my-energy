import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, of, throwError } from 'rxjs';
import { GiftCard } from '@five-of-heart/shared/interfaces';
import { GiftCardsApiService } from '../../../../services/gift-cards-api.service';
import { GiftCardsListPageComponent } from './gift-cards-list-page.component';

const makeCard = (overrides: Partial<GiftCard> = {}): GiftCard => ({
  _id: 'card-1',
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
  serviceName: 'Deep Tissue',
  servicePrice: 80,
  code: 'ABCD1234XY',
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('GiftCardsListPageComponent', () => {
  let fixture: ComponentFixture<GiftCardsListPageComponent>;
  let component: GiftCardsListPageComponent;
  let apiSpy: jasmine.SpyObj<GiftCardsApiService>;

  const setup = (
    opts: {
      cards?: GiftCard[];
      listError?: boolean;
      queryParams?: Record<string, string>;
    } = {},
  ) => {
    apiSpy = jasmine.createSpyObj<GiftCardsApiService>('GiftCardsApiService', [
      'listGiftCards',
      'redeemGiftCard',
    ]);

    apiSpy.listGiftCards.and.returnValue(
      opts.listError
        ? throwError(() => new Error('fail'))
        : of(opts.cards ?? [makeCard()]),
    );
    apiSpy.redeemGiftCard.and.returnValue(of(makeCard({ status: 'redeemed' })));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [GiftCardsListPageComponent],
      providers: [
        { provide: GiftCardsApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: opts.queryParams ?? {} },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(GiftCardsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('renders a table row for each returned card', () => {
    setup({ cards: [makeCard({ _id: 'a' }), makeCard({ _id: 'b' })] });
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('active card shows Redeem button', () => {
    setup({ cards: [makeCard({ status: 'active' })] });
    const btn = fixture.nativeElement.querySelector('.redeem-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent.trim()).toBe('Redeem');
  });

  it('redeemed card shows no Redeem button', () => {
    setup({ cards: [makeCard({ status: 'redeemed' })] });
    const btn = fixture.nativeElement.querySelector('.redeem-btn');
    expect(btn).toBeNull();
  });

  it('Redeem click disables the button while request is in flight', () => {
    setup({ cards: [makeCard()] });
    apiSpy.redeemGiftCard.and.returnValue(new Subject<GiftCard>());
    fixture.nativeElement.querySelector('.redeem-btn').click();
    expect(component.isRedeeming('card-1')).toBe(true);
    fixture.detectChanges();
    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.redeem-btn');
    expect(btn.disabled).toBe(true);
  });

  it('successful redeem updates the card in the table to redeemed', fakeAsync(() => {
    setup({ cards: [makeCard()] });
    const redeemed = makeCard({ status: 'redeemed', redeemedAt: new Date() });
    apiSpy.redeemGiftCard.and.returnValue(of(redeemed));
    fixture.nativeElement.querySelector('.redeem-btn').click();
    tick();
    fixture.detectChanges();
    expect(component.cards()[0].status).toBe('redeemed');
    expect(fixture.nativeElement.querySelector('.redeem-btn')).toBeNull();
  }));

  it('redeem error shows row-level error and re-enables button', fakeAsync(() => {
    setup({ cards: [makeCard()] });
    apiSpy.redeemGiftCard.and.returnValue(throwError(() => new Error('fail')));
    fixture.nativeElement.querySelector('.redeem-btn').click();
    tick();
    fixture.detectChanges();
    expect(component.rowError('card-1')).toBeTruthy();
    expect(component.isRedeeming('card-1')).toBe(false);
  }));

  it('empty array shows empty state with create link', () => {
    setup({ cards: [] });
    expect(fixture.nativeElement.textContent).toContain('No gift cards yet');
  });

  it('list API error shows error banner', () => {
    setup({ listError: true });
    expect(fixture.nativeElement.textContent).toContain('Failed to load');
  });

  it('shows success banner when ?created=true', () => {
    setup({ queryParams: { created: 'true' } });
    expect(fixture.nativeElement.textContent).toContain('Gift card created');
  });

  it('does not show success banner without ?created=true', () => {
    setup({});
    expect(component.showBanner()).toBe(false);
  });

  it('truncateCode shortens codes longer than 8 chars', () => {
    setup();
    expect(component.truncateCode('ABCD1234XY')).toBe('ABCD1234…');
    expect(component.truncateCode('SHORT')).toBe('SHORT');
  });
});
