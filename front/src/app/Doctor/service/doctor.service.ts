import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorSummary } from '../interfaces/doctor-summary';
import { DoctorProfile } from '../interfaces/doctor-profile';
import { PublicDoctorProfile } from '../interfaces/public-doctor-profile';
import { UpdateDoctorRequest } from '../interfaces/update-doctor-request';
import { Auth } from '../../Usuario/services/Auth/auth';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {

  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly baseUrl = 'http://localhost:8080/doctors';

  readonly myId = signal<number | null>(null);

  loadMyId(): void {
    if (!this.auth.isDoctor()) {
      this.myId.set(null);
      return;
    }
    this.http.get<DoctorSummary>(`${this.baseUrl}/me`).subscribe({
      next: (me) => this.myId.set(me.id),
      error: () => this.myId.set(null),
    });
  }

  getProfile(): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.baseUrl}/profile`);
  }

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

  getPublicProfile(doctorId: number): Observable<PublicDoctorProfile> {
    return this.http.get<PublicDoctorProfile>(`${this.baseUrl}/${doctorId}/profile`);
  }
}