import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FollowRequestService } from '../../service/follow-request.service';
import { FollowRequestStatus } from '../../interfaces/follow-request-status';
import { FollowRequest } from '../../interfaces/follow-request';

type ViewMode = 'doctor' | 'patient' | 'followers';
type LoadStatus = 'loading' | 'success' | 'error';

const TEXTS: Record<ViewMode, { title: string; subtitle: string; empty: string }> = {
  doctor: {
    title: 'Solicitudes de seguimiento',
    subtitle:
      'Pacientes y médicos que quieren seguirte. Si aprobás a un paciente se abre un chat; los médicos pasan a seguir tus consejos.',
    empty: 'Cuando un paciente o un médico te envíe una solicitud, va a aparecer acá.',
  },
  patient: {
    title: 'Mis solicitudes',
    subtitle: 'Seguí el estado de las solicitudes que enviaste a los médicos.',
    empty: 'Todavía no enviaste ninguna solicitud.',
  },
  followers: {
    title: 'Médicos que me siguen',
    subtitle: 'Médicos que siguen tus consejos. Podés disolver el seguimiento cuando quieras.',
    empty: 'Todavía no te sigue ningún médico.',
  },
};

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

  readonly title = TEXTS[this.mode].title;
  readonly subtitle = TEXTS[this.mode].subtitle;
  readonly emptyMessage = TEXTS[this.mode].empty;

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
    const request$ =
      this.mode === 'doctor'
        ? this.service.getPending()
        : this.mode === 'followers'
          ? this.service.getFollowers()
          : this.service.getSent();
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

  followerName(req: FollowRequest): string {
    if (req.patient) return `${req.patient.firstName} ${req.patient.lastName}`;
    if (req.doctorFollower) {
      return `Dr/a. ${req.doctorFollower.firstName} ${req.doctorFollower.lastName}`;
    }
    return `Solicitud #${req.id}`;
  }

  followerInitials(req: FollowRequest): string {
    const person = req.patient ?? req.doctorFollower;
    return person ? this.initials(person.firstName, person.lastName) : '';
  }

  followerPhone(req: FollowRequest): string | null {
    return req.patient?.phoneNumber ?? null;
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }
}