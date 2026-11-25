import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { DoctorService } from '../../service/doctor.service';
import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';
import { Feedback } from '../../interfaces/feedback';
import { DoctorSummary } from '../../interfaces/doctor-summary';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorService } from '../../../Tutor/services/tutor.service';
import { TutorPatient } from '../../../Tutor/models/tutor.model';

type LoadStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-doctor-search',
  imports: [FormField, RouterLink],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.css',
})
export class DoctorSearch {
  private readonly doctorService = inject(DoctorService);
  private readonly followService = inject(FollowRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly tutorService = inject(TutorService);

  readonly model = signal({ query: '' });
  readonly searchForm = form(this.model);

  private readonly rawDoctors = signal<DoctorSummary[]>([]);
  readonly doctors = computed(() =>
    this.rawDoctors().filter((d) => d.id !== this.doctorService.myId())
  );
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly lastQuery = signal('');
  readonly busyKey = signal<string | null>(null);
  readonly feedback = signal<Record<number, Feedback>>({});
  readonly isTutor = this.auth.isTutor();
  readonly tutorPatients = signal<TutorPatient[]>([]);
  readonly selectedPatientId = signal<number | null>(null);
  readonly patientLoadError = signal(false);

  constructor() {
    this.doctorService.loadMyId();
    if (!this.isTutor) {
      this.followService.loadSent();
    }
    if (this.isTutor) {
      this.tutorService.getMyPatients().subscribe({
        next: (patients) => this.tutorPatients.set(patients),
        error: (error) => {
          console.error('No se pudieron cargar los pacientes tutelados:', error);
          this.patientLoadError.set(true);
        },
      });
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const query = params.get('query') ?? '';
      this.model.set({ query });
      this.load(query);
    });
  }

  search(event: Event): void {
    event.preventDefault();
    const query = this.model().query.trim();
    const current = this.route.snapshot.queryParamMap.get('query') ?? '';
    if (query === current) {
      this.load(query);
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: { query: query || null } });
  }

  clear(): void {
    this.model.set({ query: '' });
    this.router.navigate([], { relativeTo: this.route, queryParams: { query: null } });
  }

  load(query: string): void {
    this.loadStatus.set('loading');
    this.lastQuery.set(query.trim());
    this.feedback.set({});
    this.doctorService.search(query).subscribe({
      next: (list) => {
        this.rawDoctors.set(list);
        this.loadStatus.set('success');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  hospitalLink(url: string | null | undefined): string | null {
    const clean = url?.trim() ?? '';
    return /^https?:\/\//i.test(clean) ? clean : null;
  }

  requestFollow(id: number): void {
    if (this.isTutor && this.selectedPatientId() === null) {
      this.setFeedback(id, {
        kind: 'error',
        text: 'Elegí el paciente para el que querés solicitar el seguimiento.',
      });
      return;
    }

    this.busyKey.set(`${id}:follow`);
    this.followService
      .send(id, this.isTutor ? this.selectedPatientId() : undefined)
      .pipe(finalize(() => this.busyKey.set(null)))
      .subscribe({
        next: () => {
          this.setFeedback(id, {
            kind: 'ok',
            text: 'Solicitud enviada. Podés seguirla desde Mis solicitudes.',
          });
        },
        error: () => {
          this.setFeedback(id, {
            kind: 'error',
            text: 'No se pudo enviar la solicitud. Puede que ya tengas una pendiente con este médico.',
          });
          this.followService.loadSent(
            this.isTutor ? this.selectedPatientId() ?? undefined : undefined
          );
        },
      });
  }

  isBusy(id: number, action: 'follow'): boolean {
    return this.busyKey() === `${id}:${action}`;
  }

  locked(id: number): boolean {
    if (this.isTutor && this.selectedPatientId() === null) return false;

    return this.followService.isLocked(
      id,
      this.isTutor ? this.selectedPatientId() : undefined
    );
  }

  lockedLabel(id: number): string {
    if (this.isTutor && this.selectedPatientId() === null) return '';

    return this.followService.lockedLabel(
      id,
      this.isTutor ? this.selectedPatientId() : undefined
    );
  }

  selectPatient(event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;

    const patientId = select.value ? Number(select.value) : null;
    this.selectedPatientId.set(patientId);
    this.feedback.set({});
    if (patientId === null) {
      this.followService.reset();
    } else {
      this.followService.loadSent(patientId);
    }
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  private setFeedback(id: number, value: Feedback): void {
    this.feedback.update((map) => ({ ...map, [id]: value }));
  }
}