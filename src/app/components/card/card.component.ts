import { Component, Input } from '@angular/core';
import { Healthcare, Product } from '../../models/healthcare.model';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-card',
  imports: [ButtonComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() healthcareItem!: Healthcare;
  @Input() selectedOffice: string = '';
  isExpanded: boolean = false;

  toggleDescription() {
    this.isExpanded = !this.isExpanded;
  }

  getOffices(products: { [office: string]: Product }): string[] {
    return Object.keys(products);
  }

  getPrice(office: string): string {
    const product = this.healthcareItem.products[office];

    if (typeof product.price === 'string') {
      return product.price;
    }

    const currency =
      product.price.currency === 'EUR' ? '€' : product.price.currency;

    return `${product.price.value} ${currency}`;
  }

  getBookingUrl(office?: string): string {
    if (!office) {
      const firstOffice = Object.keys(this.healthcareItem.products)[0];
      return this.healthcareItem.products[firstOffice].bookingUrl;
    }

    return this.healthcareItem.products[office].bookingUrl;
  }

  get duration(): string {
    return `${this.healthcareItem.duration.value} ${this.healthcareItem.duration.unitText}`;
  }
}
