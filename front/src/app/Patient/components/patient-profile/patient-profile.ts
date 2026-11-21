
import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import {
  FormField,
  disabled,
  form,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';

import { PatientService } from '../../service/patient.service';
import { UpdatePatientRequest } from '../../interfaces/update-patient-request';
import { DeleteAccount } from '../../../Usuario/components/delete-account/delete-account';
import { FormError } from '../../../Common/form-error/form-error';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type PhotoStatus = 'idle' | 'uploading' | 'deleting' | 'error';

type ProfileField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'phoneNumber';

type ProfileModel = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phoneNumber: string;
};

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-patient-profile',
  imports: [FormField, FormError, DeleteAccount],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile {
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = todayLocal();

  readonly status = signal<SaveStatus>('idle');
  readonly editing = signal(false);
  readonly emailNoticeVisible = signal(false);

  readonly photoStatus = signal<PhotoStatus>('idle');
  readonly photoError = signal('');

  readonly profileImageUrl = signal<string | null>(null);

  // Cambios de foto pendientes de confirmación.
  readonly pendingPhotoFile = signal<File | null>(null);
  readonly photoPreviewUrl = signal<string | null>(null);
  readonly photoRemovalPending = signal(false);

  readonly model = signal<ProfileModel>({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    phoneNumber: '',
  });

  private readonly initialModel = signal<ProfileModel | null>(null);

  readonly loadStatus = signal<LoadStatus>('loading');

  readonly initials = computed(() => {
    const firstName = this.model().firstName.trim();
    const lastName = this.model().lastName.trim();

    return (
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
    );
  });

  readonly photoUrl = computed(() => {
    const preview = this.photoPreviewUrl();

    if (preview) {
      return preview;
    }

    if (this.photoRemovalPending()) {
      return null;
    }

    const url = this.profileImageUrl();

    if (!url) {
      return null;
    }

    return /^https?:\/\//i.test(url)
      ? url
      : `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  });

  readonly profileForm = form(this.model, (path) => {
    required(path.firstName, {
      message: 'El nombre es obligatorio.',
    });

    maxLength(path.firstName, 50, {
      message: 'El nombre no puede superar los 50 caracteres.',
    });

    required(path.lastName, {
      message: 'El apellido es obligatorio.',
    });

    maxLength(path.lastName, 50, {
      message: 'El apellido no puede superar los 50 caracteres.',
    });

    required(path.birthDate, {
      message: 'La fecha de nacimiento es obligatoria.',
    });

    validate(path.birthDate, ({ value }) =>
      value() >= this.today
        ? {
            kind: 'past',
            message: 'La fecha de nacimiento debe ser una fecha pasada.',
          }
        : undefined
    );

    maxLength(path.phoneNumber, 20, {
      message: 'El teléfono no puede superar los 20 caracteres.',
    });

    validate(path.phoneNumber, ({ value }) => {
      const phoneNumber = value().trim();

      if (!phoneNumber) {
        return undefined;
      }

      if (phoneNumber.length < 7) {
        return {
          kind: 'minLength',
          message: 'El teléfono debe tener al menos 7 caracteres.',
        };
      }

      if (!/^\+?[0-9\s\-()]+$/.test(phoneNumber)) {
        return {
          kind: 'pattern',
          message: 'Solo se permiten números, espacios, guiones, paréntesis o el signo +.',
        };
      }

      return undefined;
    });

    disabled(path, () => !this.editing());
  });

  readonly hasChanges = computed(() => {
    const initial = this.initialModel();

    return !!initial && (
      initial.firstName !== this.profileForm.firstName().value() ||
      initial.lastName !== this.profileForm.lastName().value() ||
      initial.birthDate !== this.profileForm.birthDate().value() ||
      initial.phoneNumber !== this.profileForm.phoneNumber().value() ||
      this.pendingPhotoFile() !== null ||
      this.photoRemovalPending()
    );
  });

  constructor() {
    this.loadProfile();
    this.loadProfilePhoto();

    this.destroyRef.onDestroy(() => {
      this.clearPhotoPreview();
    });
  }

  // -------------------------
  // CARGA DEL PERFIL
  // -------------------------

  loadProfile(): void {
    this.loadStatus.set('loading');

    this.patientService.getProfile().subscribe({
      next: (profile) => {
        const values: ProfileModel = {
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
      error: (error) => {
        console.error('Error al cargar perfil del paciente:', error);
        this.loadStatus.set('error');
      },
    });
  }

  // -------------------------
  // FOTO DE PERFIL
  // -------------------------

  loadProfilePhoto(): void {
    this.patientService.getProfilePhoto().subscribe({
      next: (response) => {
        this.profileImageUrl.set(response.profileImageUrl ?? null);
      },
      error: (error) => {
        console.error('Error al cargar foto de perfil:', error);
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!this.editing() || this.status() === 'saving') {
      input.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.photoError.set('Seleccioná una imagen JPG, PNG o WEBP.');
      this.photoStatus.set('error');
      input.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      this.photoError.set('La imagen no puede superar los 5 MB.');
      this.photoStatus.set('error');
      input.value = '';
      return;
    }

    // No se sube todavía. Se crea una vista previa temporal.
    this.clearPhotoPreview();

    this.pendingPhotoFile.set(file);
    this.photoRemovalPending.set(false);
    this.photoPreviewUrl.set(URL.createObjectURL(file));

    this.photoError.set('');
    this.photoStatus.set('idle');

    input.value = '';
  }

  removeProfilePhoto(): void {
    if (!this.editing() || this.status() === 'saving') {
      return;
    }

    this.photoError.set('');

    // Descarta una foto nueva que todavía no fue confirmada.
    this.clearPhotoPreview();
    this.pendingPhotoFile.set(null);

    // La eliminación real queda pendiente de confirmación.
    this.photoRemovalPending.set(!!this.profileImageUrl());

    this.photoStatus.set('idle');
  }

  private clearPhotoPreview(): void {
    const preview = this.photoPreviewUrl();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    this.photoPreviewUrl.set(null);
  }

  private resetPendingPhotoChanges(): void {
    this.clearPhotoPreview();

    this.pendingPhotoFile.set(null);
    this.photoRemovalPending.set(false);

    this.photoStatus.set('idle');
    this.photoError.set('');
  }

  private finishProfileSave(savedValues: ProfileModel): void {
    this.model.set(savedValues);
    this.initialModel.set({ ...savedValues });

    this.resetPendingPhotoChanges();

    this.editing.set(false);
    this.status.set('success');
  }

  private savePendingPhoto(savedValues: ProfileModel): void {
    const pendingFile = this.pendingPhotoFile();

    if (pendingFile) {
      this.photoStatus.set('uploading');

      this.patientService.uploadProfilePhoto(pendingFile).subscribe({
        next: (response) => {
          this.profileImageUrl.set(response.profileImageUrl ?? null);
          this.finishProfileSave(savedValues);
        },
        error: (error) => {
          console.error('Error al subir foto de perfil:', error);

          this.photoError.set(
            error?.error?.message ??
            error?.error?.error ??
            'No se pudo subir la foto. Volvé a confirmar para reintentar.'
          );

          this.photoStatus.set('error');
          this.status.set('error');
        },
      });

      return;
    }

    if (this.photoRemovalPending()) {
      this.photoStatus.set('deleting');

      this.patientService.removeProfilePhoto().subscribe({
        next: (response) => {
          this.profileImageUrl.set(response.profileImageUrl ?? null);
          this.finishProfileSave(savedValues);
        },
        error: (error) => {
          console.error('Error al eliminar foto de perfil:', error);

          this.photoError.set(
            error?.error?.message ??
            error?.error?.error ??
            'No se pudo quitar la foto. Volvé a confirmar para reintentar.'
          );

          this.photoStatus.set('error');
          this.status.set('error');
        },
      });

      return;
    }

    this.finishProfileSave(savedValues);
  }

  // -------------------------
  // EDICIÓN Y VALIDACIONES
  // -------------------------

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();

    return state.touched() && state.invalid();
  }

  toggleEditing(): void {
    if (this.editing()) {
      const initial = this.initialModel();

      if (initial) {
        this.model.set({ ...initial });
      }

      this.profileForm().reset();

      // Cancelar descarta cualquier cambio pendiente de foto.
      this.resetPendingPhotoChanges();

      this.status.set('idle');
      this.editing.set(false);

      return;
    }

    this.status.set('idle');
    this.editing.set(true);
  }

  // -------------------------
  // GUARDADO
  // -------------------------

  submit(event: Event): void {
    event.preventDefault();

    if (!this.editing() || !this.hasChanges()) {
      return;
    }

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
      phoneNumber: value.phoneNumber.trim() || null,
    };

    this.status.set('saving');

    this.patientService.updateProfile(request).subscribe({
      next: () => {
        const savedValues: ProfileModel = {
          firstName: request.firstName,
          lastName: request.lastName,
          email: this.model().email,
          birthDate: request.birthDate,
          phoneNumber: request.phoneNumber ?? '',
        };

        this.model.set(savedValues);
        this.initialModel.set({ ...savedValues });

        // La foto se sube o elimina recién después de confirmar.
        this.savePendingPhoto(savedValues);
      },
      error: (error) => {
        console.error('Error al guardar perfil:', error);
        this.status.set('error');
      },
    });
  }
}
