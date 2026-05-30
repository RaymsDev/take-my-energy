import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, DOCUMENT } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HealthAndBeautyBusiness, WithContext } from 'schema-dts';
import { createService } from '../data/services.data';
import { Healthcare } from '../models/healthcare.model';

@Injectable({
  providedIn: 'root',
})
export class HealthcareService {
  private dataUrl = 'data/healthcare.json';

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  getJsonLDContent(): Observable<WithContext<HealthAndBeautyBusiness>> {
    return this.http
      .get<Healthcare[]>(this.dataUrl)
      .pipe(map((data) => createService(data, this.document.location.origin)));
  }

  getHealthcareContent(): Observable<Healthcare[]> {
    return this.http.get<Healthcare[]>(this.dataUrl);
  }
}
