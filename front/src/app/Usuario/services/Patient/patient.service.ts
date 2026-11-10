import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PatientProfile {
  patientId: number;
  userId: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
  medicalRecordId: number | null;
}

export interface UpdatePatientProfileRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8080/patients';

  getMyProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.BASE_URL}/profile`);
  }

  getProfile(patientId?: number | null): Observable<PatientProfile> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<PatientProfile>(`${this.BASE_URL}/profile`, { params });
  }

  updateProfile(
    patientId: number | null,
    data: UpdatePatientProfileRequest,
  ): Observable<void> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.put<void>(`${this.BASE_URL}/profile`, data, { params });
  }
}
