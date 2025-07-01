import { Component, OnInit } from '@angular/core';
import { SITE_CONFIG } from '../../../../configs';
import { ScriptLoaderService } from '../../../../services/script-loader.service';

@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
  providers: [ScriptLoaderService],
})
export class TestimonialsComponent implements OnInit {
  constructor(private scriptLoader: ScriptLoaderService) {}

  ngOnInit(): void {
    this.scriptLoader.loadScript(SITE_CONFIG['GOOGLE_REVIEWS_SCRIPT']);
  }
}
