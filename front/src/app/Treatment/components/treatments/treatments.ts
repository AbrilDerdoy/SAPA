import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TreatmentService } from '../../service/treatment.service';
import { PatientService } from '../../../Patient/service/patient.service';
import { TreatmentRequest } from '../../interfaces/treatment-request';
import { TreatmentFrequency } from '../../interfaces/treatment-frequency';
import { TreatmentDuration } from '../../interfaces/treatment-duration';
import { Treatment } from '../../interfaces/treatment';
import { DURATION_UNITS, FREQUENCY_UNITS } from '../../interfaces/const';
import { TreatmentForm } from '../treatment-form/treatment-form';

type LoadStatus = 'loading' | 'success' | 'error';

function readRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
    return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-treatments',
  imports: [FormField, RouterLink, TreatmentForm],
  templateUrl: './treatments.html',
  styleUrl: './treatments.css',
})
export class Treatments {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(TreatmentService);
  private readonly patientService = inject(PatientService);

  readonly isDoctor = readRole() === 'DOCTOR';

  readonly patientId = signal<number | null>(
    this.isDoctor ? Number(this.route.snapshot.paramMap.get('patientId')) || null : null
  );
  private readonly resolvingId = signal(!this.isDoctor);

  readonly title = this.isDoctor ? 'Tratamientos del paciente' : 'Mis tratamientos';
  readonly lead = this.isDoctor
    ? 'Consultá, agregá y ajustá los tratamientos indicados a este paciente.'
    : 'Acá ves los tratamientos indicados para vos.';
  readonly backLink = this.isDoctor ? '/mis-pacientes' : '/home';
  readonly backLabel = this.isDoctor ? 'Volver a mis pacientes' : 'Volver al inicio';

  readonly filterModel = signal({ filter: '' });
  readonly filterForm = form(this.filterModel);
  readonly hasFilter = computed(() => this.filterModel().filter.trim().length > 0);

  readonly treatments = signal<Treatment[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly loadError = signal('');

  readonly formOpen = signal(false);
  readonly editing = signal<Treatment | null>(null);
  readonly saving = signal(false);

  readonly notice = signal('');
  readonly actionError = signal('');

  readonly confirmId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  private current?: Subscription;

  constructor() {
    if (!this.isDoctor) {
      this.resolvePatient();
    }

    toObservable(computed(() => this.filterModel().filter.trim()))
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  retry(): void {
    if (this.patientId() === null && !this.isDoctor) {
      this.resolvePatient();
    } else {
      this.load();
    }
  }

  load(): void {
    const id = this.patientId();
    if (id === null) {
      if (!this.resolvingId()) {
        this.loadError.set('No pudimos identificar al paciente.');
        this.loadStatus.set('error');
      }
      return;
    }

    this.current?.unsubscribe();
    if (this.loadStatus() !== 'success') {
      this.loadStatus.set('loading');
    }

    const term = this.filterModel().filter.trim();
    const request = term ? this.service.filterByName(id, term) : this.service.getByPatient(id);

    this.current = request.subscribe({
      next: (list) => {
        this.treatments.set(list);
        this.loadStatus.set('success');
      },
      error: (err) => {
        this.loadError.set(this.messageFor(err, 'No pudimos cargar los tratamientos.'));
        this.loadStatus.set('error');
      },
    });
  }

  openCreate(): void {
    this.clearFeedback();
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(treatment: Treatment): void {
    this.clearFeedback();
    this.confirmId.set(null);
    this.editing.set(treatment);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.actionError.set('');
  }

  onSave(request: TreatmentRequest): void {
    const id = this.patientId();
    if (id === null) return;

    const target = this.editing();
    this.saving.set(true);
    this.actionError.set('');

    const call = target
      ? this.service.update(target.treatmentId, request)
      : this.service.create(id, request);

    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editing.set(null);
        this.notice.set(target ? 'Tratamiento actualizado.' : 'Tratamiento creado.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.messageFor(err, 'No se pudo guardar el tratamiento.'));
      },
    });
  }

  askDelete(id: number): void {
    this.clearFeedback();
    this.confirmId.set(id);
  }

  cancelDelete(): void {
    this.confirmId.set(null);
  }

  confirmDelete(treatment: Treatment): void {
    this.deletingId.set(treatment.treatmentId);
    this.service.remove(treatment.treatmentId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmId.set(null);
        this.notice.set('Tratamiento eliminado.');
        this.load();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.confirmId.set(null);
        this.actionError.set(this.messageFor(err, 'No se pudo eliminar el tratamiento.'));
      },
    });
  }

  frequencyLabel(frequency: TreatmentFrequency): string {
    const unit = FREQUENCY_UNITS.find((u) => u.value === frequency.unit);
    if (!unit) return `Cada ${frequency.length} ${frequency.unit}`;
    return frequency.length === 1 ? `Cada ${unit.singular}` : `Cada ${frequency.length} ${unit.plural}`;
  }

  durationLabel(duration: TreatmentDuration): string {
    if (duration.unit === 'INDETERMINATE') return 'Duración indeterminada';
    const unit = DURATION_UNITS.find((u) => u.value === duration.unit);
    if (!unit) return `Durante ${duration.length} ${duration.unit}`;
    return `Durante ${duration.length} ${duration.length === 1 ? unit.singular : unit.plural}`;
  }

  private resolvePatient(): void {
    this.resolvingId.set(true);
    this.loadStatus.set('loading');
    this.patientService.getProfile().subscribe({
      next: (profile) => {
        this.patientId.set(profile.patientId);
        this.resolvingId.set(false);
        this.load();
      },
      error: () => {
        this.resolvingId.set(false);
        this.loadError.set('No pudimos identificar tu perfil de paciente.');
        this.loadStatus.set('error');
      },
    });
  }

  private clearFeedback(): void {
    this.notice.set('');
    this.actionError.set('');
  }

  private messageFor(err: unknown, fallback: string): string {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 403) return 'No tenés permiso para acceder a los tratamientos de este paciente.';
    if (status === 404) return 'No encontramos el paciente o el tratamiento.';
    if (status === 400) return 'Los datos enviados no son válidos. Revisalos e intentá de nuevo.';
    return fallback;
  }
}