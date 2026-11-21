import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FollowRequest } from '../interfaces/follow-request';
import { FollowRequestStatus } from '../interfaces/follow-request-status';

@Injectable({ providedIn: 'root' })
export class FollowRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/follow-requests';

  readonly sentRequests = signal<FollowRequest[]>([]);

  private readonly latestByDoctor = computed(() => {
    const map = new Map<number, FollowRequest>();
    for (const request of this.sentRequests()) {
      const doctorId = request.doctor?.id;
      if (doctorId === undefined) continue;
      const current = map.get(doctorId);
      if (!current || new Date(request.requestedAt) > new Date(current.requestedAt)) {
        map.set(doctorId, request);
      }
    }
    return map;
  });

  statusFor(doctorId: number, patientId?: number | null): FollowRequestStatus | null {
    if (patientId != null) {
      const request = this.sentRequests()
        .filter((item) => item.doctor?.id === doctorId && item.patient?.id === patientId)
        .sort((left, right) =>
          new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
        )[0];
      return request?.status ?? null;
    }

    return this.latestByDoctor().get(doctorId)?.status ?? null;
  }

  isLocked(doctorId: number, patientId?: number | null): boolean {
    const status = this.statusFor(doctorId, patientId);
    return status === 'PENDING' || status === 'APPROVED';
  }

  lockedLabel(doctorId: number, patientId?: number | null): string {
    switch (this.statusFor(doctorId, patientId)) {
      case 'PENDING':
        return 'Solicitud enviada';
      case 'APPROVED':
        return 'Siguiendo';
      default:
        return '';
    }
  }

  loadSent(patientId?: number): void {
    this.getSent(patientId).subscribe({
      next: (list) => this.sentRequests.set(list),
      error: () => this.sentRequests.set([]),
    });
  }

  reset(): void {
    this.sentRequests.set([]);
  }

  send(doctorId: number, patientId?: number | null): Observable<FollowRequest> {
    const params = patientId != null ? `?patientId=${patientId}` : '';
    return this.http
      .post<FollowRequest>(`${this.baseUrl}/send/${doctorId}${params}`, {})
      .pipe(tap((created) => this.sentRequests.update((list) => [...list, created])));
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

  getSent(patientId?: number): Observable<FollowRequest[]> {
    const params = patientId != null ? `?patientId=${patientId}` : '';
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/sent${params}`);
  }

  getFollowers(): Observable<FollowRequest[]> {
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/followers`);
  }

  getApprovedPatients(): Observable<FollowRequest[]> {
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/approved`);
  }
}