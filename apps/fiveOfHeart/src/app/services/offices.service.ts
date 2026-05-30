import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OfficeContent } from '../models/office.model';

@Injectable({
  providedIn: 'root',
})
export class OfficesService {
  private dataUrl = 'data/offices.json';

  constructor(private http: HttpClient) {}

  getMassageHomeContent(): Observable<OfficeContent[]> {
    return this.http.get<OfficeContent[]>(this.dataUrl);
  }
}
