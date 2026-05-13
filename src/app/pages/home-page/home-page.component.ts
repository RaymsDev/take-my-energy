import { Component } from '@angular/core';
import { HealthcareComponent } from '../../containers/healthcare/healthcare.component';
import { AboutComponent } from './components/about/about.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { MainBannerComponent } from '../../components/main-banner/main-banner.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-home-page',
  imports: [
    AboutComponent,
    TestimonialsComponent,
    HealthcareComponent,
    MainBannerComponent,
    RevealDirective,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
