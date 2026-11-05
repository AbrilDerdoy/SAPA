import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FollowRequest } from '../interfaces/follow-request';

@Injectable({
  providedIn: 'root',
})
export class FollowRequestService {
  private readonly http = inject(HttpClient);
  readonly sentDoctorIds = signal<number[]>([]);
  private readonly baseUrl = 'http://localhost:8080/follow-requests';

  send(doctorId: number): Observable<FollowRequest> {
  return this.http
    .post<FollowRequest>(`${this.baseUrl}/send/${doctorId}`, {})
    .pipe(
      tap(() =>
        this.sentDoctorIds.update((ids) => (ids.includes(doctorId) ? ids : [...ids, doctorId]))
      )
    );
}

  hasSent(doctorId: number): boolean {
    return this.sentDoctorIds().includes(doctorId);
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

  getSent(): Observable<FollowRequest[]> {
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/sent`);
  }
}