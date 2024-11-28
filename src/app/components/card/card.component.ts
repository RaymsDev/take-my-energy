import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SITE_CONFIG } from '../../configs';
import { Healthcare } from '../../models/healthcare.model';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnInit {
  @Input() healthcareItem!: Healthcare;
  @Input() selectedOffice: string = '';
  bookingUrl: string = '';
  isExpanded: boolean = false;

  ngOnInit() {
    this.bookingUrl = this.getBookingUrl();
  }

  toggleDescription() {
    this.isExpanded = !this.isExpanded;
  }

  getCabinets(prices: { [cabinet: string]: string }): string[] {
    return Object.keys(prices).filter((cabinet) => prices[cabinet] !== 'NO');
  }

  get duration(): string {
    return `${this.healthcareItem.duration.value} ${this.healthcareItem.duration.unitText}`;
  }

  /**
   * TODO: This method should be refactored to put the booking URL in the healthcare model and in the json data
   */
  private getBookingUrl(): string {
    switch (this.healthcareItem.title) {
      case 'Soins énergétiques':
        return SITE_CONFIG['ENERGETIC_CARE'];
      case 'Massage Holistique':
        return SITE_CONFIG['HOLISTIC_CARE'];
      case 'Micro massage crânien':
        return SITE_CONFIG['HEAD_MASSAGE'];
      case "Bougies d'oreille Hopi":
        return SITE_CONFIG['CANDLE_HOPI'];
      case 'Barrage des brûlures':
        return SITE_CONFIG['BURN_CARE'];
      case 'Massage Knap':
        return SITE_CONFIG['KNAP_MASSAGE'];
      default:
        return SITE_CONFIG['BOOKING'];
    }
  }
}
