import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../components/card/card.component';
import { Healthcare } from '../../../../models/healthcare.model';

@Component({
  selector: 'app-list',
  imports: [CardComponent],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent {
  @Input() healthcareItems: Healthcare[] = [];
  @Input() selectedOffice: string = '';
}
