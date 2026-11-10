import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FollowRequest } from '../interfaces/follow-request';

@Injectable({
  providedIn: 'root',
})
export class FollowRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/follow-requests';

  send(doctorId: number, patientId?: number | null): Observable<FollowRequest> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.post<FollowRequest>(
      `${this.baseUrl}/send/${doctorId}`,
      {},
      { params }
    );
  }

  approve(id: number): Observable<FollowRequest> {
    return this.http.patch<FollowRequest>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: number): Observable<FollowRequest> {
    return this.http.patch<FollowRequest>(`${this.baseUrl}/${id}/reject`, {});
  }

  dissolve(id: number): Observable<FollowRequest> {
    return this.http.patch<FollowRequest>(`${this.baseUrl}/${id}/dissolve`, {});
  }

  getPending(): Observable<FollowRequest[]> {
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/pending`);
  }

  getSent(patientId?: number | null): Observable<FollowRequest[]> {
    const params = patientId
      ? new HttpParams().set('patientId', patientId)
      : undefined;

    return this.http.get<FollowRequest[]>(`${this.baseUrl}/sent`, { params });
  }

    // Se obtienen los pacientes aprobados.
  getApprovedPatients(): Observable<FollowRequest[]> {
  return this.http.get<FollowRequest[]>(`${this.baseUrl}/approved`);
}
}