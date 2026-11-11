import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorSummary } from '../interfaces/doctor-summary';
import { UpdateDoctorRequest } from '../interfaces/update-doctor-request';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/doctors';

  updateProfile(request: UpdateDoctorRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile`, request);
  }

  search(query: string): Observable<DoctorSummary[]> {
    let params = new HttpParams();
    const term = query.trim();
    if (term) {
      params = params.set('query', term);
    }
    return this.http.get<DoctorSummary[]>(`${this.baseUrl}/search`, { params });
  }

  getHospitalUrl(doctorId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${doctorId}/hospital-url`, { responseType: 'text' });
  }
}