import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MassageContent } from '../models/massages.model';

@Injectable()
export class MassageService {
  private dataUrl = 'data/massages.json';

  constructor(private http: HttpClient) {}

  getMassageContent(type: string): Observable<MassageContent> {
    return this.http
      .get<{ [key: string]: MassageContent }>(this.dataUrl)
      .pipe(map((data) => data[type]));
  }
}
