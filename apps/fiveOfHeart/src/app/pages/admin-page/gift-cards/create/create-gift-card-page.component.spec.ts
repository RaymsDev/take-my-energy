import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { CatalogService, GiftCard } from '@five-of-heart/shared/interfaces';
import { GiftCardsApiService } from '../../../../services/gift-cards-api.service';
import { CreateGiftCardPageComponent } from './create-gift-card-page.component';

const mockCatalog = (): CatalogService[] => [
  {
    id: 'svc-1',
    title: 'Deep Tissue',
    price: 80,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: 'svc-2',
    title: 'Relaxation',
    price: 65,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
];

const mockCard = (): GiftCard => ({
  _id: 'card-1',
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
  serviceName: 'Deep Tissue',
  servicePrice: 80,
  code: 'ABC123',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('CreateGiftCardPageComponent', () => {
  let fixture: ComponentFixture<CreateGiftCardPageComponent>;
  let component: CreateGiftCardPageComponent;
  let apiSpy: jasmine.SpyObj<GiftCardsApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = (opts: { catalogError?: boolean } = {}) => {
    apiSpy = jasmine.createSpyObj<GiftCardsApiService>('GiftCardsApiService', [
      'getCatalog',
      'createGiftCard',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getCatalog.and.returnValue(
      opts.catalogError
        ? throwError(() => new Error('fail'))
        : of(mockCatalog()),
    );
    apiSpy.createGiftCard.and.returnValue(of(mockCard()));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateGiftCardPageComponent],
      providers: [
        { provide: GiftCardsApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    fixture = TestBed.createComponent(CreateGiftCardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const fillValidForm = () => {
    component.form.setValue({
      serviceId: 'svc-1',
      recipientName: 'Alice',
      recipientEmail: 'alice@example.com',
      senderName: 'Bob',
      message: '',
    });
  };

  it('submit button is disabled when form is invalid', () => {
    setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    );
    expect(btn.disabled).toBe(true);
  });

  it('submit button enabled when all required fields are valid', () => {
    setup();
    fillValidForm();
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    );
    expect(btn.disabled).toBe(false);
  });

  it('invalid email disables submit', () => {
    setup();
    component.form.setValue({
      serviceId: 'svc-1',
      recipientName: 'Alice',
      recipientEmail: 'not-an-email',
      senderName: 'Bob',
      message: '',
    });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    );
    expect(btn.disabled).toBe(true);
  });

  it('message > 500 chars marks field invalid', () => {
    setup();
    component.form.get('message')?.setValue('x'.repeat(501));
    expect(component.form.get('message')?.errors?.['maxlength']).toBeTruthy();
  });

  it('successful submit navigates to /admin/gift-cards?created=true', fakeAsync(() => {
    setup();
    fillValidForm();
    component.submit();
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/gift-cards'], {
      queryParams: { created: 'true' },
    });
  }));

  it('submitting=true during in-flight request disables button', () => {
    setup();
    fillValidForm();
    fixture.detectChanges();
    apiSpy.createGiftCard.and.returnValue(new Subject<GiftCard>());
    component.submit();
    expect(component.submitting()).toBe(true);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    );
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('API error sets errorMessage and resets submitting', fakeAsync(() => {
    setup();
    fillValidForm();
    apiSpy.createGiftCard.and.returnValue(throwError(() => new Error('422')));
    component.submit();
    tick();
    expect(component.errorMessage()).toBeTruthy();
    expect(component.submitting()).toBe(false);
  }));

  it('catalog load failure shows catalogError', () => {
    setup({ catalogError: true });
    expect(component.catalogError()).toBeTruthy();
  });

  it('loads catalog and renders options in the select', () => {
    setup();
    fixture.detectChanges();
    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll('select option');
    expect(options.length).toBe(3); // placeholder + 2 catalog items
  });
});
