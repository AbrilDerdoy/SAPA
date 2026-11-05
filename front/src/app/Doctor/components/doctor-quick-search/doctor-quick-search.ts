import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { DoctorService } from '../../service/doctor.service';
import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';
import { Feedback } from '../../interfaces/feedback';
import { DoctorSummary } from '../../interfaces/doctor-summary';

type PanelStatus = 'idle' | 'loading' | 'success' | 'error';

const MIN_CHARS = 2;
const MAX_VISIBLE = 5;

@Component({
  selector: 'app-doctor-quick-search',
  imports: [FormField, RouterLink],
  templateUrl: './doctor-quick-search.html',
  styleUrl: './doctor-quick-search.css',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class DoctorQuickSearch {
  private readonly doctorService = inject(DoctorService);
  private readonly followService = inject(FollowRequestService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly model = signal({ query: '' });
  readonly quickForm = form(this.model);

  readonly query = computed(() => this.model().query.trim());
  readonly open = signal(false);
  readonly status = signal<PanelStatus>('idle');
  readonly results = signal<DoctorSummary[]>([]);
  readonly busyId = signal<number | null>(null);
  readonly feedback = signal<Record<number, Feedback>>({});

  readonly visible = computed(() => this.results().slice(0, MAX_VISIBLE));
  readonly showPanel = computed(() => this.open() && this.query().length >= MIN_CHARS);

  constructor() {
    toObservable(this.query)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((q) => {
          this.feedback.set({});
          if (q.length < MIN_CHARS) {
            this.results.set([]);
            this.status.set('idle');
          } else {
            this.status.set('loading');
          }
        }),
        switchMap((q) =>
          q.length < MIN_CHARS
            ? EMPTY
            : this.doctorService.search(q).pipe(
                catchError(() => {
                  this.status.set('error');
                  return EMPTY;
                })
              )
        ),
        takeUntilDestroyed()
      )
      .subscribe((list) => {
        this.results.set(list);
        this.status.set('success');
      });
  }

  goToFullSearch(event: Event): void {
    event.preventDefault();
    this.open.set(false);
    this.router.navigate(['/medicos'], { queryParams: { query: this.query() || null } });
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

requestFollow(id: number): void {
  this.busyId.set(id);
  this.followService.send(id).subscribe({
    next: () => {
      this.busyId.set(null);
    },
    error: () => {
      this.setFeedback(id, {
        kind: 'error',
        text: 'No se pudo enviar. Puede que ya tengas una solicitud pendiente.',
      });
      this.busyId.set(null);
    },
  });
}

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  private setFeedback(id: number, value: Feedback): void {
    this.feedback.update((map) => ({ ...map, [id]: value }));
  }

  hasSent(id: number): boolean {
    return this.followService.hasSent(id);
  }
}