import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import { GiftCardsApiService } from '../../../../services/gift-cards-api.service';

@Component({
  selector: 'app-create-gift-card-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-gift-card-page.component.html',
  styleUrl: './create-gift-card-page.component.scss',
})
export class CreateGiftCardPageComponent implements OnInit {
  private readonly api = inject(GiftCardsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  catalog = signal<CatalogService[]>([]);
  catalogError = signal<string | null>(null);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    serviceId: ['', Validators.required],
    recipientName: ['', Validators.required],
    recipientEmail: ['', [Validators.required, Validators.email]],
    senderName: ['', Validators.required],
    message: ['', Validators.maxLength(500)],
  });

  get messageLength(): number {
    return this.form.get('message')?.value?.length ?? 0;
  }

  ngOnInit(): void {
    this.api.getCatalog().subscribe({
      next: (items) => this.catalog.set(items),
      error: () =>
        this.catalogError.set(
          'Impossible de charger les prestations. Veuillez rafraîchir la page.',
        ),
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.value;
    this.api
      .createGiftCard({
        serviceId: value.serviceId!,
        recipientName: value.recipientName!,
        recipientEmail: value.recipientEmail!,
        senderName: value.senderName!,
        message: value.message ?? undefined,
      })
      .subscribe({
        next: () =>
          this.router.navigate(['/admin/gift-cards'], {
            queryParams: { created: 'true' },
          }),
        error: () => {
          this.errorMessage.set('Échec de la création. Veuillez réessayer.');
          this.submitting.set(false);
        },
      });
  }
}
