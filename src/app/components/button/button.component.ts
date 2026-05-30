import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  imports: [],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() url: string = '';
}
