import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { PatientService } from '../../service/patient.service';
import { UpdatePatientRequest } from '../../interfaces/update-patient-request';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveStatus ='idle' | 'saving' | 'success' | 'error';
type ProfileField = 'firstName' | 'lastName' | 'birthDate' | 'phoneNumber';

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-patient-profile',
  imports: [FormField],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile {
  private readonly patientService = inject(PatientService);

  readonly today = todayLocal();
  readonly status = signal<SaveStatus>('idle');

  readonly model = signal({
    firstName: '',
    lastName: '',
    birthDate: '',
    phoneNumber: '',
  });

  readonly profileForm = form(this.model, (path) => {
    required(path.firstName, { message: 'El nombre es obligatorio.' });
    maxLength(path.firstName, 50, { message: 'El nombre no puede superar los 50 caracteres.' });

    required(path.lastName, { message: 'El apellido es obligatorio.' });
    maxLength(path.lastName, 50, { message: 'El apellido no puede superar los 50 caracteres.' });

    required(path.birthDate, { message: 'La fecha de nacimiento es obligatoria.' });

    required(path.phoneNumber, { message: 'El número de teléfono es obligatorio.' });
    minLength(path.phoneNumber, 7, { message: 'El teléfono debe tener al menos 7 caracteres.' });
    maxLength(path.phoneNumber, 20, { message: 'El teléfono no puede superar los 20 caracteres.' });
    pattern(path.phoneNumber, /^\+?[0-9\s\-\(]+$/, {
      message: 'Solo se permiten números, espacios, guiones o el signo +.',
    });
  });

  readonly loadStatus = signal<LoadStatus>('loading');

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadStatus.set('loading');
    this.patientService.getProfile().subscribe({
      next: (profile) => {
        this.model.set({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          birthDate: profile.birthDate ?? '',
          phoneNumber: profile.phoneNumber ?? '',
        });
        this.loadStatus.set('ready');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  readonly birthDateError = computed(() => {
    const value = this.model().birthDate;
    return value && value >= this.today ? 'La fecha de nacimiento debe ser una fecha pasada.' : '';
  });

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();
    const extra = field === 'birthDate' && !!this.birthDateError();
    return state.touched() && (state.invalid() || extra);
  }

  errorsOf(field: ProfileField): string[] {
    const messages = this.profileForm[field]()
      .errors()
      .map((e) => e.message)
      .filter((m): m is string => !!m);
    if (field === 'birthDate' && this.birthDateError()) {
      messages.push(this.birthDateError());
    }
    return messages;
  }

  submit(event: Event): void {
    event.preventDefault();

    if (this.profileForm().invalid() || this.birthDateError()) {
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
      next: () => this.status.set('success'),
      error: () => this.status.set('error'),
    });
  }
}