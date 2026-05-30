import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-selected-office',
  standalone: true,
  templateUrl: './selected-office.component.html',
  styleUrls: ['./selected-office.component.scss'],
})
export class SelectedOfficeComponent {
  @Input() officeLabel: string = '';
  @Input() officeAddress: string = '';
}
