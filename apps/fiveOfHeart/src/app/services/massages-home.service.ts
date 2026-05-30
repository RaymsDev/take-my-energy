import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MassageHomeContent } from '../models/massages.model';

@Injectable()
export class MassageHomeService {
  private dataUrl = 'data/massages-home.json';

  constructor(private http: HttpClient) {}

  getMassageHomeContent(): Observable<MassageHomeContent[]> {
    return this.http.get<MassageHomeContent[]>(this.dataUrl);
  }
}
