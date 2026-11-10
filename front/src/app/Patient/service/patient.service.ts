import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient';
import { UpdatePatientRequest } from '../interfaces/update-patient-request';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/patients';

  getProfile(): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/profile`);
  }

  updateProfile(request: UpdatePatientRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile`, request);
  }

  getMyProfile(): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/profile`);
  }

  getMyPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/my-patients`);
  }
}