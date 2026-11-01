import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FdaResponse } from '../interfaces/fda-response';

@Injectable({
  providedIn: 'root',
})
export class MedicationSearchService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:8080/fda';

  searchMedication(name: string): Observable<FdaResponse | null> {
    const params = new HttpParams().set('medicationName', name.trim());
    return this.http.get<FdaResponse | null>(`${this.baseUrl}/search-medication`, { params });
  }
}