import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HealthTip, CreateHealthTip } from '../models/health-tip';

@Injectable({
  providedIn: 'root'
})
export class HealthTipService {

  private readonly API_URL = 'http://localhost:8080/health-tips';

  private readonly http = inject(HttpClient);

  getAll(): Observable<HealthTip[]> {
    return this.http.get<HealthTip[]>(this.API_URL);
  }

  getMyTips(): Observable<HealthTip[]> {
    return this.http.get<HealthTip[]>(`${this.API_URL}/my-tips`);
  }

  getByDoctor(doctorId: number): Observable<HealthTip[]> {
    return this.http.get<HealthTip[]>(
      `${this.API_URL}/doctor/${doctorId}`
    );
  }

  create(tip: CreateHealthTip): Observable<HealthTip> {
    return this.http.post<HealthTip>(this.API_URL, tip);
  }
}