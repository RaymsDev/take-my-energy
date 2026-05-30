import { Component } from '@angular/core';
import { SITE_CONFIG } from '../../configs';

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent {
  public facebookUrl: string = SITE_CONFIG['FACEBOOK'];
  public googleUrl: string = SITE_CONFIG['GOOGLE'];
}
