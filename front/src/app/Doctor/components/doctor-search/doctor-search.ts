import { Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { DoctorService } from '../../service/doctor.service';
import { DoctorSummary } from '../../interfaces/doctor-summary';
import { Feedback } from '../../interfaces/feedback';
import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';

type LoadStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-doctor-search',
  imports: [FormField],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.css',
})
export class DoctorSearch implements OnInit {
  private readonly doctorService = inject(DoctorService);
  private readonly followService = inject(FollowRequestService);

  readonly model = signal({ query: '' });
  readonly searchForm = form(this.model);

  readonly doctors = signal<DoctorSummary[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly lastQuery = signal('');
  readonly busyKey = signal<string | null>(null);
  readonly feedback = signal<Record<number, Feedback>>({});
  readonly hospitalUrls = signal<Record<number, string>>({});

  ngOnInit(): void {
    this.load('');
  }

  search(event: Event): void {
    event.preventDefault();
    this.load(this.model().query);
  }

  clear(): void {
    this.model.set({ query: '' });
    this.load('');
  }

  load(query: string): void {
    this.loadStatus.set('loading');
    this.lastQuery.set(query.trim());
    this.feedback.set({});
    this.hospitalUrls.set({});
    this.doctorService.search(query).subscribe({
      next: (list) => {
        this.doctors.set(list);
        this.loadStatus.set('success');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  showHospital(id: number): void {
    this.busyKey.set(`${id}:hospital`);
    this.doctorService.getHospitalUrl(id).subscribe({
      next: (url) => {
        const clean = url.trim();
        if (/^https?:\/\//i.test(clean)) {
          this.hospitalUrls.update((map) => ({ ...map, [id]: clean }));
        } else {
          this.setFeedback(id, { kind: 'error', text: 'El enlace registrado no es válido.' });
        }
        this.busyKey.set(null);
      },
      error: () => {
        this.setFeedback(id, {
          kind: 'error',
          text: 'Este médico no tiene un enlace de hospital registrado.',
        });
        this.busyKey.set(null);
      },
    });
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
        this.busyKey.set(null);
      },
    });
  }

  isBusy(id: number, action: 'hospital' | 'follow'): boolean {
    return this.busyKey() === `${id}:${action}`;
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  private setFeedback(id: number, value: Feedback): void {
    this.feedback.update((map) => ({ ...map, [id]: value }));
  }
}