import { Component, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form, maxLength, minLength, pattern, required, validate } from '@angular/forms/signals';
import { PatientService } from '../../service/patient.service';
import { UpdatePatientRequest } from '../../interfaces/update-patient-request';
import { FormError } from '../../../Common/form-error/form-error';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveStatus ='idle' | 'saving' | 'success' | 'error';
type ProfileField = 'firstName' | 'lastName' | 'birthDate' | 'phoneNumber';
type ProfileModel = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phoneNumber: string;
};

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-patient-profile',
  imports: [FormField, FormError],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile {
  private readonly patientService = inject(PatientService);

  readonly today = todayLocal();
  readonly status = signal<SaveStatus>('idle');
  readonly editing = signal(false);
  readonly emailNoticeVisible = signal(false);

  readonly model = signal<ProfileModel>({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    phoneNumber: '',
  });
  private readonly initialModel = signal<ProfileModel | null>(null);

  readonly profileForm = form(this.model, (path) => {
    required(path.firstName, { message: 'El nombre es obligatorio.' });
    maxLength(path.firstName, 50, { message: 'El nombre no puede superar los 50 caracteres.' });

    required(path.lastName, { message: 'El apellido es obligatorio.' });
    maxLength(path.lastName, 50, { message: 'El apellido no puede superar los 50 caracteres.' });

    required(path.birthDate, { message: 'La fecha de nacimiento es obligatoria.' });
    validate(path.birthDate, ({ value }) =>
      value() >= this.today
        ? { kind: 'past', message: 'La fecha de nacimiento debe ser una fecha pasada.' }
        : undefined
    );

    required(path.phoneNumber, { message: 'El número de teléfono es obligatorio.' });
    minLength(path.phoneNumber, 7, { message: 'El teléfono debe tener al menos 7 caracteres.' });
    maxLength(path.phoneNumber, 20, { message: 'El teléfono no puede superar los 20 caracteres.' });
    pattern(path.phoneNumber, /^\+?[0-9\s\-\(]+$/, {
      message: 'Solo se permiten números, espacios, guiones o el signo +.',
    });

    disabled(path, () => !this.editing());
  });

  readonly hasChanges = computed(() => {
    const initial = this.initialModel();
    return !!initial && (
      initial.firstName !== this.profileForm.firstName().value() ||
      initial.lastName !== this.profileForm.lastName().value() ||
      initial.birthDate !== this.profileForm.birthDate().value() ||
      initial.phoneNumber !== this.profileForm.phoneNumber().value()
    );
  });

  readonly loadStatus = signal<LoadStatus>('loading');

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadStatus.set('loading');
    this.patientService.getProfile().subscribe({
      next: (profile) => {
        const values = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          birthDate: profile.birthDate ?? '',
          phoneNumber: profile.phoneNumber ?? '',
        };
        this.model.set(values);
        this.initialModel.set({ ...values });
        this.loadStatus.set('ready');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  toggleEditing(): void {
    if (this.editing()) {
      const initial = this.initialModel();
      if (initial) this.model.set(initial);
      this.profileForm().reset();
      this.status.set('idle');
      this.editing.set(false);
      return;
    }

    this.status.set('idle');
    this.editing.set(true);
  }

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();
    return state.touched() && state.invalid();
  }

  submit(event: Event): void {
    event.preventDefault();

    if (!this.editing() || !this.hasChanges()) return;

    if (this.profileForm().invalid()) {
      this.profileForm().markAsTouched();
      this.status.set('idle');
      return;
    }

    const value = this.model();
    const request: UpdatePatientRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      birthDate: value.birthDate,
      phoneNumber: value.phoneNumber.trim(),
    };

    this.status.set('saving');
    this.patientService.updateProfile(request).subscribe({
      next: () => {
        const savedValues = {
          firstName: request.firstName,
          lastName: request.lastName,
          email: this.model().email,
          birthDate: request.birthDate,
          phoneNumber: request.phoneNumber,
        };
        this.model.set(savedValues);
        this.initialModel.set({ ...savedValues });
        this.editing.set(false);
        this.status.set('success');
      },
      error: () => this.status.set('error'),
    });
  }
}