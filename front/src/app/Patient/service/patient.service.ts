import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdatePatientRequest } from '../interfaces/update-patient-request';
import { Patient } from '../interfaces/patient';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/patients';

  updateProfile(request: UpdatePatientRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile`, request);
  }

  getMyPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/my-patients`);
  }
}