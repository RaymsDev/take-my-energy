import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MassageContent } from '../../models/massages.model';
import { MassageService } from '../../services/massage.service';

@Component({
  selector: 'app-massage-details-page',
  templateUrl: './massage-details-page.component.html',
  styleUrls: ['./massage-details-page.component.scss'],
  imports: [CommonModule],
  providers: [MassageService],
})
export class MassageDetailsPageComponent implements OnInit {
  content!: MassageContent;

  constructor(
    private massageService: MassageService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type');
      if (type) {
        this.loadContent(type);
      }
    });
  }

  loadContent(type: string): void {
    this.massageService.getMassageContent(type).subscribe((content) => {
      this.content = content;
    });
  }
}
