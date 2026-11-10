import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FollowRequestService } from '../../service/follow-request.service';
import { FollowRequest } from '../../interfaces/follow-request';
import { FollowRequestStatus } from '../../interfaces/follow-request-status';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorPatientSelector } from '../../../Tutor/components/tutor-patient-selector/tutor-patient-selector';

type ViewMode = 'doctor' | 'patient';
type LoadStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-follow-requests',
  imports: [DatePipe, TutorPatientSelector],
  templateUrl: './follow-requests.html',
  styleUrl: './follow-requests.css',
})
export class FollowRequests implements OnInit{

  private readonly service = inject(FollowRequestService);
  private readonly route = inject(ActivatedRoute);

  readonly auth = inject(Auth);

  readonly mode: ViewMode = (this.route.snapshot.data['mode'] as ViewMode) ?? 'doctor';

  readonly selectedPatientId = signal<number | null>(null);

  readonly requests = signal<FollowRequest[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly busyId = signal<number | null>(null);
  readonly actionError = signal('');

  readonly title = computed(() =>
    this.mode === 'doctor'
      ? 'Solicitudes de seguimiento'
      : this.auth.isTutor()
        ? 'Seguimiento de mis pacientes'
        : 'Mis solicitudes'
  );

  readonly subtitle = computed(() =>
    this.mode === 'doctor'
      ? 'Pacientes que quieren que los sigas. Al aprobar, se abre un chat con ellos.'
      : this.auth.isTutor()
        ? 'Seguí el estado de las solicitudes de seguimiento de los pacientes a tu cargo.'
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
    if (this.auth.isTutor()) {
      const initialPatientId = Number(
        this.route.snapshot.queryParamMap.get('patientId')
      );

      if (Number.isFinite(initialPatientId) && initialPatientId > 0) {
        this.selectedPatientId.set(initialPatientId);
        this.load();
        return;
      }

      this.loadStatus.set('success');
      return;
    }

    this.load();
  }

  onPatientSelected(patientId: number): void {
    this.selectedPatientId.set(patientId);
    this.load();
  }

  load(): void {
    if (this.auth.isTutor() && this.selectedPatientId() === null) {
      return;
    }

    this.loadStatus.set('loading');
    const request$ = this.mode === 'doctor'
      ? this.service.getPending()
      : this.service.getSent(this.selectedPatientId());
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