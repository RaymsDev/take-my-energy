import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SITE_CONFIG } from '../../configs';

@Component({
  selector: 'app-session-page',
  imports: [RouterModule],
  templateUrl: './session-page.component.html',
  styleUrl: './session-page.component.scss',
})
export class SessionPageComponent {
  public bookingUrl: string = SITE_CONFIG['BOOKING'];
}
