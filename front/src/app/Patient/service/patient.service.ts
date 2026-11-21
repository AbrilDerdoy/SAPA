
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient';
import { UpdatePatientRequest } from '../interfaces/update-patient-request';

export interface UserProfilePhotoResponse {
  email: string;
  role: string;
  status: string;
  createdAt: string;
  profileImageUrl: string | null;
}

export interface ProfilePhotoResponse {
  profileImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/patients';
  private readonly usersUrl = 'http://localhost:8080/users';

  getProfile(patientId?: number | null): Observable<Patient> {
    const params = patientId != null
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<Patient>(`${this.baseUrl}/profile`, { params });
  }

  updateProfile(request: UpdatePatientRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile`, request);
  }

  getProfilePhoto(): Observable<UserProfilePhotoResponse> {
    return this.http.get<UserProfilePhotoResponse>(
      `${this.usersUrl}/profile`
    );
  }

  uploadProfilePhoto(file: File): Observable<ProfilePhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ProfilePhotoResponse>(
      `${this.usersUrl}/profile/photo`,
      formData
    );
  }

  removeProfilePhoto(): Observable<ProfilePhotoResponse> {
    return this.http.delete<ProfilePhotoResponse>(
      `${this.usersUrl}/profile/photo`
    );
  }

  getMyPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/my-patients`);
  }
}
