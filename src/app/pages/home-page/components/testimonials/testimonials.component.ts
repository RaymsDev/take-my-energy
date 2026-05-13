import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Review } from '../../../../models/review.model';

@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
})
export class TestimonialsComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  @ViewChild('track') trackRef!: ElementRef<HTMLElement>;

  reviews: Review[] = [];
  currentIndex = 0;
  cardsPerView = 3;
  private expandedIds = new Set<number>();
  truncatedIds = new Set<number>();

  readonly totalReviews = 120;
  readonly starsArray = [1, 2, 3, 4, 5];

  private readonly avatarColors = [
    '#f5ede3',
    '#dde8dd',
    '#e3eef5',
    '#f5e3e8',
    '#e8e3f5',
    '#f5f0e3',
    '#e3f5ee',
    '#fce8e3',
  ];

  ngOnInit(): void {
    this.updateCardsPerView();
    this.http.get<Review[]>('data/testimonials.json').subscribe((data) => {
      this.reviews = data;
      setTimeout(() => this.checkTruncation(), 0);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateCardsPerView();
    this.expandedIds.clear();
    setTimeout(() => this.checkTruncation(), 0);
  }

  private checkTruncation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.trackRef?.nativeElement)
      return;
    this.truncatedIds.clear();
    const wrappers = this.trackRef.nativeElement.querySelectorAll<HTMLElement>(
      '.testimonials__card__text-wrap',
    );
    wrappers.forEach((el, i) => {
      if (this.reviews[i] && el.scrollHeight > el.clientHeight + 2) {
        this.truncatedIds.add(this.reviews[i].id);
      }
    });
  }

  private updateCardsPerView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth < 768) this.cardsPerView = 1;
    else if (window.innerWidth < 1024) this.cardsPerView = 2;
    else this.cardsPerView = 3;
  }

  get maxIndex(): number {
    return Math.max(0, this.reviews.length - this.cardsPerView);
  }

  get dotsArray(): number[] {
    return Array.from({ length: this.maxIndex + 1 }, (_, i) => i);
  }

  scroll(direction: 'prev' | 'next'): void {
    if (!isPlatformBrowser(this.platformId) || !this.trackRef) return;
    const track = this.trackRef.nativeElement;
    const card = track.querySelector('.testimonials__card') as HTMLElement;
    if (!card) return;
    const step = card.offsetWidth + 24;
    this.currentIndex =
      direction === 'next'
        ? Math.min(this.maxIndex, this.currentIndex + 1)
        : Math.max(0, this.currentIndex - 1);
    track.scrollTo({ left: this.currentIndex * step, behavior: 'smooth' });
  }

  goToDot(index: number): void {
    if (!isPlatformBrowser(this.platformId) || !this.trackRef) return;
    const track = this.trackRef.nativeElement;
    const card = track.querySelector('.testimonials__card') as HTMLElement;
    if (!card) return;
    this.currentIndex = index;
    track.scrollTo({
      left: index * (card.offsetWidth + 24),
      behavior: 'smooth',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  toggleExpanded(id: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }
}
