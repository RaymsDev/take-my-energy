import { Component } from '@angular/core';
import { HealthcareComponent } from '../../containers/healthcare/healthcare.component';
import { AboutComponent } from './components/about/about.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { MainBannerComponent } from '../../components/main-banner/main-banner.component';

@Component({
  selector: 'app-home-page',
  imports: [
    AboutComponent,
    TestimonialsComponent,
    HealthcareComponent,
    MainBannerComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
