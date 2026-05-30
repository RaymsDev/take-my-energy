import { Component } from '@angular/core';
import { OfficesService } from '../../services/offices.service';
import { OfficeContent } from '../../models/office.model';

@Component({
  selector: 'app-office-page',
  templateUrl: './office-page.component.html',
  styleUrls: ['./office-page.component.scss'],
  imports: [],
})
export class OfficePageComponent {
  offices: OfficeContent[] = [];

  constructor(private officesService: OfficesService) {}

  ngOnInit(): void {
    this.officesService.getMassageHomeContent().subscribe((data) => {
      this.offices = data;
    });
  }

  officeIndex(i: number): string {
    return i < 9 ? '0' + (i + 1) : String(i + 1);
  }
}
