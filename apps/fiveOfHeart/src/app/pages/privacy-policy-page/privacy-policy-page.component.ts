import { Component, OnDestroy, OnInit } from '@angular/core';
import { LegalService } from '../../services/legal.service';
import { Subject, takeUntil } from 'rxjs';
import { PrivacyPolicy } from '../../models/legal.model';

@Component({
  selector: 'app-privacy-policy-page',
  imports: [],
  templateUrl: './privacy-policy-page.component.html',
  styleUrl: './privacy-policy-page.component.scss',
})
export class PrivacyPolicyPageComponent implements OnInit, OnDestroy {
  privacyPolicy: PrivacyPolicy[] = [];
  objectKeys = Object.keys;
  destroy$ = new Subject<void>();

  constructor(private legalService: LegalService) {}

  ngOnInit() {
    this.legalService
      .getPrivacyPolicy()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.privacyPolicy = data;
      });
  }

  isString(value: unknown): value is string {
    return this.legalService.isString(value);
  }

  isObject(value: unknown): value is { [key: string]: string } {
    return this.legalService.isObject(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
