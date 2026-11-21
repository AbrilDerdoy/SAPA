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

type SortOption = 'default' | 'recent' | 'name-asc' | 'name-desc' | 'freq-asc' | 'freq-desc' | 'dur-asc' | 'dur-desc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Sin ordenar' },
  { value: 'recent', label: 'Recién agregados' },
  { value: 'name-asc', label: 'Nombre (A → Z)' },
  { value: 'name-desc', label: 'Nombre (Z → A)' },
  { value: 'freq-asc', label: 'Frecuencia: más seguido primero' },
  { value: 'freq-desc', label: 'Frecuencia: menos seguido primero' },
  { value: 'dur-asc', label: 'Duración: más corta primero' },
  { value: 'dur-desc', label: 'Duración: más larga primero' },
];

const FREQ_HOURS: Record<string, number> = { HOUR: 1, DAY: 24, WEEK: 168, MONTH: 720 };
const DUR_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365, SESSIONS: 1 };

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
  readonly isTutor = readRole() === 'TUTOR';

  readonly patientId = signal<number | null>(
    this.isDoctor || this.isTutor
      ? Number(this.route.snapshot.paramMap.get('patientId')) || null
      : null
  );
  private readonly resolvingId = signal(!this.isDoctor && !this.isTutor);

  readonly title = this.isDoctor || this.isTutor
    ? 'Tratamientos del paciente'
    : 'Mis tratamientos';
  readonly lead = this.isDoctor
    ? 'Consultá, agregá y ajustá los tratamientos indicados a este paciente.'
    : this.isTutor
      ? 'Consultá los tratamientos indicados al paciente bajo tu tutela.'
    : 'Acá ves los tratamientos indicados para vos.';
  readonly backLink = this.isDoctor
    ? '/mis-pacientes'
    : this.isTutor
      ? `/tutor/patients/${this.patientId()}/profile`
      : '/home';
  readonly backLabel = this.isDoctor
    ? 'Volver a mis pacientes'
    : this.isTutor
      ? 'Volver al perfil del paciente'
      : 'Volver al inicio';

  readonly filterModel = signal({ filter: '' });
  readonly filterForm = form(this.filterModel);
  readonly hasFilter = computed(() => this.filterModel().filter.trim().length > 0);

  readonly filtersOpen = signal(false);
  readonly sortOptions = SORT_OPTIONS;
  readonly durationUnits = DURATION_UNITS;
  readonly frequencyUnits = FREQUENCY_UNITS;

  readonly sortBy = signal<SortOption>('default');
  readonly durationUnitFilter = signal<string>('ALL');
  readonly frequencyUnitFilter = signal<string>('ALL');

  readonly activeFilters = computed(
    () =>
      (this.sortBy() !== 'default' ? 1 : 0) +
      (this.durationUnitFilter() !== 'ALL' ? 1 : 0) +
      (this.frequencyUnitFilter() !== 'ALL' ? 1 : 0)
  );

  readonly treatments = signal<Treatment[]>([]);

  readonly visibleTreatments = computed(() => {
    const dUnit = this.durationUnitFilter();
    const fUnit = this.frequencyUnitFilter();
    let list = this.treatments().filter(
      (t) =>
        (dUnit === 'ALL' || t.duration.unit === dUnit) &&
        (fUnit === 'ALL' || t.frequency.unit === fUnit)
    );

    const freq = (t: Treatment) => t.frequency.length * (FREQ_HOURS[t.frequency.unit] ?? 1);
    const dur = (t: Treatment) =>
      t.duration.unit === 'INDETERMINATE'
        ? Number.MAX_SAFE_INTEGER
        : t.duration.length * (DUR_DAYS[t.duration.unit] ?? 1);

list = [...list];
    switch (this.sortBy()) {
      case 'recent':
        return list.sort((a, b) => b.treatmentId - a.treatmentId);
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, 'es'));
      case 'freq-asc':
        return list.sort((a, b) => freq(a) - freq(b));
      case 'freq-desc':
        return list.sort((a, b) => freq(b) - freq(a));
      case 'dur-asc':
        return list.sort((a, b) => dur(a) - dur(b));
      case 'dur-desc':
        return list.sort((a, b) => dur(b) - dur(a));
      default:
        return list;
    }
  });

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
    if (!this.isDoctor && !this.isTutor) {
      this.resolvePatient();
    }

    toObservable(computed(() => this.filterModel().filter.trim()))
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  clearFilters(): void {
    this.sortBy.set('default');
    this.durationUnitFilter.set('ALL');
    this.frequencyUnitFilter.set('ALL');
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
    if (!this.isDoctor) return;
    this.clearFeedback();
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(treatment: Treatment): void {
    if (!this.isDoctor) return;
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