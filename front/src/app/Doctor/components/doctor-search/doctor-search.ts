import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { DoctorService } from '../../service/doctor.service';
import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';
import { Feedback } from '../../interfaces/feedback';
import { DoctorSummary } from '../../interfaces/doctor-summary';

type LoadStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-doctor-search',
  imports: [FormField],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.css',
})
export class DoctorSearch {
  private readonly doctorService = inject(DoctorService);
  private readonly followService = inject(FollowRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly model = signal({ query: '' });
  readonly searchForm = form(this.model);

  readonly doctors = signal<DoctorSummary[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly lastQuery = signal('');
  readonly busyKey = signal<string | null>(null);
  readonly feedback = signal<Record<number, Feedback>>({});

  constructor() {
    this.followService.loadSent();
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
        this.doctors.set(list);
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
    this.busyKey.set(`${id}:follow`);
    this.followService.send(id).subscribe({
      next: () => {
        this.setFeedback(id, {
          kind: 'ok',
          text: 'Solicitud enviada. Podés seguirla desde Mis solicitudes.',
        });
        this.busyKey.set(null);
      },
      error: () => {
        this.setFeedback(id, {
          kind: 'error',
          text: 'No se pudo enviar la solicitud. Puede que ya tengas una pendiente con este médico.',
        });
        this.followService.loadSent();
        this.busyKey.set(null);
      },
    });
  }

  isBusy(id: number, action: 'hospital' | 'follow'): boolean {
    return this.busyKey() === `${id}:${action}`;
  }

  locked(id: number): boolean {
    return this.followService.isLocked(id);
  }

  lockedLabel(id: number): string {
    return this.followService.lockedLabel(id);
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  private setFeedback(id: number, value: Feedback): void {
    this.feedback.update((map) => ({ ...map, [id]: value }));
  }
}