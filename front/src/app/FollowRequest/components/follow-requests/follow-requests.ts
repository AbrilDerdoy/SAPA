import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FollowRequestService } from '../../service/follow-request.service';
import { FollowRequestStatus } from '../../interfaces/follow-request-status';
import { FollowRequest } from '../../interfaces/follow-request';

type ViewMode = 'doctor' | 'patient';
type LoadStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-follow-requests',
  imports: [DatePipe],
  templateUrl: './follow-requests.html',
  styleUrl: './follow-requests.css',
})
export class FollowRequests implements OnInit {
  private readonly service = inject(FollowRequestService);
  private readonly route = inject(ActivatedRoute);

  readonly mode: ViewMode = (this.route.snapshot.data['mode'] as ViewMode) ?? 'doctor';

  readonly requests = signal<FollowRequest[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly busyId = signal<number | null>(null);
  readonly actionError = signal('');

  readonly title = computed(() =>
    this.mode === 'doctor' ? 'Solicitudes de seguimiento' : 'Mis solicitudes'
  );

  readonly subtitle = computed(() =>
    this.mode === 'doctor'
      ? 'Pacientes que quieren que los sigas. Al aprobar, se abre un chat con ellos.'
      : 'Seguí el estado de las solicitudes que enviaste a los médicos.'
  );

  readonly sorted = computed(() =>
    [...this.requests()].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    )
  );

  readonly statusLabels: Record<FollowRequestStatus, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    DISOLVED: 'Disuelta',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadStatus.set('loading');
    const request$ = this.mode === 'doctor' ? this.service.getPending() : this.service.getSent();
    request$.subscribe({
      next: (list) => {
        this.requests.set(list);
        this.loadStatus.set('success');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  approve(id: number): void {
    this.busyId.set(id);
    this.actionError.set('');
    this.service.approve(id).subscribe({
      next: () => {
        this.requests.update((list) => list.filter((r) => r.id !== id));
        this.busyId.set(null);
      },
      error: () => {
        this.actionError.set('No se pudo aprobar la solicitud. Probá de nuevo.');
        this.busyId.set(null);
      },
    });
  }

  reject(id: number): void {
    this.busyId.set(id);
    this.actionError.set('');
    this.service.reject(id).subscribe({
      next: () => {
        this.requests.update((list) => list.filter((r) => r.id !== id));
        this.busyId.set(null);
      },
      error: () => {
        this.actionError.set('No se pudo rechazar la solicitud. Probá de nuevo.');
        this.busyId.set(null);
      },
    });
  }

  dissolve(id: number): void {
    if (!confirm('¿Seguro que querés disolver este seguimiento?')) return;
    this.busyId.set(id);
    this.actionError.set('');
    this.service.dissolve(id).subscribe({
      next: (updated) => {
        this.requests.update((list) => list.map((r) => (r.id === id ? updated : r)));
        this.service.loadSent();
        this.busyId.set(null);
      },
      error: () => {
        this.actionError.set('No se pudo disolver el seguimiento. Probá de nuevo.');
        this.busyId.set(null);
      },
    });
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }
}