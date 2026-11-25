
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MedicalRecordAccessRequest {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordAccessService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8080/medical-record-access-requests';

  requestAccess(patientId: number): Observable<MedicalRecordAccessRequest> {
    return this.http.post<MedicalRecordAccessRequest>(
      `${this.apiUrl}/patient/${patientId}`,
      {}
    );
  }

  getPendingRequests(patientId?: number | null): Observable<MedicalRecordAccessRequest[]> {
    const params = patientId != null
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<MedicalRecordAccessRequest[]>(
      `${this.apiUrl}/pending`,
      { params }
    );
  }

  getApprovedRequests(patientId?: number | null): Observable<MedicalRecordAccessRequest[]> {
    const params = patientId != null
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<MedicalRecordAccessRequest[]>(
      `${this.apiUrl}/approved`,
      { params }
    );
  }

  getSentRequests(): Observable<MedicalRecordAccessRequest[]> {
    return this.http.get<MedicalRecordAccessRequest[]>(
      `${this.apiUrl}/sent`
    );
  }

  approve(id: number): Observable<MedicalRecordAccessRequest> {
    return this.http.patch<MedicalRecordAccessRequest>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

  reject(id: number): Observable<MedicalRecordAccessRequest> {
    return this.http.patch<MedicalRecordAccessRequest>(
      `${this.apiUrl}/${id}/reject`,
      {}
    );
  }

  revoke(id: number): Observable<MedicalRecordAccessRequest> {
    return this.http.patch<MedicalRecordAccessRequest>(
      `${this.apiUrl}/${id}/revoke`,
      {}
    );
  }
}
