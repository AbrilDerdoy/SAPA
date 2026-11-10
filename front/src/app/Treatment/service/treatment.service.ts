import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Treatment } from '../interfaces/treatment';
import { TreatmentRequest } from '../interfaces/treatment-request';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/treatments';

  getByPatient(patientId: number): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.baseUrl}/patient/${patientId}`);
  }

  filterByName(patientId: number, name: string): Observable<Treatment[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Treatment[]>(`${this.baseUrl}/patient/${patientId}/filter`, { params });
  }

  create(patientId: number, request: TreatmentRequest): Observable<Treatment> {
    return this.http.post<Treatment>(`${this.baseUrl}/patient/${patientId}`, request);
  }

  update(treatmentId: number, request: TreatmentRequest): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.baseUrl}/${treatmentId}`, request);
  }

  remove(treatmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${treatmentId}`);
  }
}