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

  statusFor(doctorId: number): FollowRequestStatus | null {
    return this.latestByDoctor().get(doctorId)?.status ?? null;
  }

  isLocked(doctorId: number): boolean {
    const status = this.statusFor(doctorId);
    return status === 'PENDING' || status === 'APPROVED';
  }

  lockedLabel(doctorId: number): string {
    switch (this.statusFor(doctorId)) {
      case 'PENDING':
        return 'Solicitud enviada';
      case 'APPROVED':
        return 'Siguiendo';
      default:
        return '';
    }
  }

  loadSent(): void {
    this.getSent().subscribe({
      next: (list) => this.sentRequests.set(list),
      error: () => this.sentRequests.set([]),
    });
  }

  reset(): void {
    this.sentRequests.set([]);
  }

  send(doctorId: number): Observable<FollowRequest> {
    return this.http
      .post<FollowRequest>(`${this.baseUrl}/send/${doctorId}`, {})
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

  getSent(): Observable<FollowRequest[]> {
    return this.http.get<FollowRequest[]>(`${this.baseUrl}/sent`);
  }

    // Se obtienen los pacientes aprobados.
  getApprovedPatients(): Observable<FollowRequest[]> {
  return this.http.get<FollowRequest[]>(`${this.baseUrl}/approved`);
}
}