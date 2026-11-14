import { Component, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { httpResource } from '@angular/common/http';
import { DoctorService } from '../../service/doctor.service';
import { Speciality } from '../../interfaces/speciality';
import { UpdateDoctorRequest } from '../../interfaces/update-doctor-request';
import { DeleteAccount } from '../../../Usuario/components/delete-account/delete-account';
import { FormError } from '../../../Common/form-error/form-error';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type ProfileField = 'firstName' | 'lastName' | 'phoneNumber' | 'licenseNumber' | 'bio' | 'hospitalUrl';
type ProfileModel = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  bio: string;
  hospitalUrl: string;
};

@Component({
  selector: 'app-doctor-profile',
  imports: [FormField, FormError, DeleteAccount],
  templateUrl: './doctor-profile.html',
  styleUrl: './doctor-profile.css',
})
export class DoctorProfile {
  private readonly doctorService = inject(DoctorService);

  readonly specialities = httpResource<Speciality[]>(() => 'http://localhost:8080/specialities');
  readonly selectedSpeciality = signal<number | null>(null);
  readonly specialityTouched = signal(false);
  readonly status = signal<SaveStatus>('idle');
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly editing = signal(false);
  readonly emailNoticeVisible = signal(false);

  readonly specialityInvalid = computed(
    () => this.specialityTouched() && this.selectedSpeciality() === null
  );

  readonly model = signal<ProfileModel>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    bio: '',
    hospitalUrl: '',
  });
  private readonly initialModel = signal<ProfileModel | null>(null);
  private readonly initialSpeciality = signal<number | null>(null);

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadStatus.set('loading');
    this.doctorService.getProfile().subscribe({
      next: (profile) => {
        const values: ProfileModel = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          licenseNumber: profile.licenseNumber ?? '',
          bio: profile.bio ?? '',
          hospitalUrl: profile.hospitalUrl ?? '',
        };
        const selectedSpeciality = profile.speciality ?? null;
        this.model.set(values);
        this.initialModel.set({ ...values });
        this.selectedSpeciality.set(selectedSpeciality);
        this.initialSpeciality.set(selectedSpeciality);
        this.loadStatus.set('ready');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  toggleEditing(): void {
    if (this.editing()) {
      const initial = this.initialModel();
      const initialSpeciality = this.initialSpeciality();
      if (initial) this.model.set(initial);
      this.selectedSpeciality.set(initialSpeciality);
      this.profileForm().reset();
      this.specialityTouched.set(false);
      this.status.set('idle');
      this.editing.set(false);
      return;
    }

    this.status.set('idle');
    this.editing.set(true);
  }

  readonly profileForm = form(this.model, (path) => {
    required(path.firstName, { message: 'El nombre es obligatorio.' });
    maxLength(path.firstName, 50, { message: 'El nombre no puede superar los 50 caracteres.' });

    required(path.lastName, { message: 'El apellido es obligatorio.' });
    maxLength(path.lastName, 50, { message: 'El apellido no puede superar los 50 caracteres.' });

    required(path.phoneNumber, { message: 'El número de teléfono es obligatorio.' });
    minLength(path.phoneNumber, 7, { message: 'El teléfono debe tener al menos 7 caracteres.' });
    maxLength(path.phoneNumber, 20, { message: 'El teléfono no puede superar los 20 caracteres.' });
    pattern(path.phoneNumber, /^\+?[0-9\s\-\(]+$/, {
      message: 'Solo se permiten números, espacios, guiones o el signo +.',
    });

    required(path.licenseNumber, { message: 'La matrícula es obligatoria.' });
    minLength(path.licenseNumber, 3, { message: 'La matrícula debe tener al menos 3 caracteres.' });
    maxLength(path.licenseNumber, 30, { message: 'La matrícula no puede superar los 30 caracteres.' });

    maxLength(path.bio, 1000, { message: 'La biografía no puede superar los 1000 caracteres.' });

    maxLength(path.hospitalUrl, 255, { message: 'La URL no puede superar los 255 caracteres.' });
    pattern(path.hospitalUrl, /^(https?:\/\/\S+\.\S+)?$/i, {
      message: 'Ingresá una URL válida que empiece con http:// o https://',
    });

    disabled(path, () => !this.editing());
  });

  readonly hasChanges = computed(() => {
    const initial = this.initialModel();
    const initialSpeciality = this.initialSpeciality();

    return !!initial && (
      initial.firstName !== this.profileForm.firstName().value() ||
      initial.lastName !== this.profileForm.lastName().value() ||
      initial.phoneNumber !== this.profileForm.phoneNumber().value() ||
      initial.licenseNumber !== this.profileForm.licenseNumber().value() ||
      initial.bio !== this.profileForm.bio().value() ||
      initial.hospitalUrl !== this.profileForm.hospitalUrl().value() ||
      initialSpeciality !== this.selectedSpeciality()
    );
  });

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();
    return state.touched() && state.invalid();
  }

  isSelected(id: number): boolean {
    return this.selectedSpeciality() === id;
  }

  selectSpeciality(event: Event): void {
    this.specialityTouched.set(true);
    const select = event.target as HTMLSelectElement;
    this.selectedSpeciality.set(select.value ? Number(select.value) : null);
  }

  submit(event: Event): void {
    event.preventDefault();
    if (!this.editing() || !this.hasChanges()) return;

    this.specialityTouched.set(true);

    const selectedSpeciality = this.selectedSpeciality();
    if (this.profileForm().invalid() || selectedSpeciality === null) {
      this.profileForm().markAsTouched();
      this.status.set('idle');
      return;
    }

    const value = this.model();
    const request: UpdateDoctorRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phoneNumber: value.phoneNumber.trim(),
      licenseNumber: value.licenseNumber.trim(),
      bio: value.bio.trim() || null,
      hospitalUrl: value.hospitalUrl.trim() || null,
      speciality: selectedSpeciality,
    };

    this.status.set('saving');
    this.doctorService.updateProfile(request).subscribe({
      next: () => {
        const savedValues: ProfileModel = {
          firstName: request.firstName,
          lastName: request.lastName,
          email: this.model().email,
          phoneNumber: request.phoneNumber,
          licenseNumber: request.licenseNumber,
          bio: request.bio ?? '',
          hospitalUrl: request.hospitalUrl ?? '',
        };
        this.model.set(savedValues);
        this.initialModel.set({ ...savedValues });
        this.initialSpeciality.set(selectedSpeciality);
        this.editing.set(false);
        this.status.set('success');
      },
      error: () => this.status.set('error'),
    });
  }
}