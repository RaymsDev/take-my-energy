import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-filter',
  standalone: true,
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent {
  @Input() offices: { id: string; label: string }[] = [];
  @Output() filter = new EventEmitter<string>();
  selectedOfficeId: string = '';
  emptyOfficeId: string = '';

  onFilter(officeId: string): void {
    this.selectedOfficeId = officeId;
    this.filter.emit(officeId);
  }
}
