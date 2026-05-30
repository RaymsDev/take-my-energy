import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MassagesHomeComponent } from '../../pages/home-page/components/massages-home/massages-home.component';

@Component({
  selector: 'app-healthcare-page',
  imports: [RouterModule, MassagesHomeComponent],
  templateUrl: './healthcare.component.html',
  styleUrl: './healthcare.component.scss',
})
export class HealthcareComponent {}
