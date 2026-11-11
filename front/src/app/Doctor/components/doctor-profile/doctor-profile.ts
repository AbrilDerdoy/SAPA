import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { httpResource } from '@angular/common/http';
import { DoctorService } from '../../service/doctor.service';
import { Speciality } from '../../interfaces/speciality';
import { UpdateDoctorRequest } from '../../interfaces/update-doctor-request';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type ProfileField = 'firstName' | 'lastName' | 'phoneNumber' | 'licenseNumber' | 'bio' | 'hospitalUrl';

@Component({
  selector: 'app-doctor-profile',
  imports: [FormField],
  templateUrl: './doctor-profile.html',
  styleUrl: './doctor-profile.css',
})
export class DoctorProfile {
  private readonly doctorService = inject(DoctorService);

  readonly specialities = httpResource<Speciality[]>(() => 'http://localhost:8080/specialities');
  readonly selectedSpecialities = signal<number[]>([]);
  readonly specialitiesTouched = signal(false);
  readonly status = signal<SaveStatus>('idle');

  readonly specialitiesInvalid = computed(
    () => this.specialitiesTouched() && this.selectedSpecialities().length === 0
  );

  readonly model = signal({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    licenseNumber: '',
    bio: '',
    hospitalUrl: '',
  });

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
  });

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();
    return state.touched() && state.invalid();
  }

  errorsOf(field: ProfileField): string[] {
    return this.profileForm[field]()
      .errors()
      .map((e) => e.message)
      .filter((m): m is string => !!m);
  }

  isSelected(id: number): boolean {
    return this.selectedSpecialities().includes(id);
  }

  toggleSpeciality(id: number): void {
    this.specialitiesTouched.set(true);
    this.selectedSpecialities.update((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    );
  }

  submit(event: Event): void {
    event.preventDefault();
    this.specialitiesTouched.set(true);

    if (this.profileForm().invalid() || this.selectedSpecialities().length === 0) {
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
      specialities: this.selectedSpecialities(),
    };

    this.status.set('saving');
    this.doctorService.updateProfile(request).subscribe({
      next: () => this.status.set('success'),
      error: () => this.status.set('error'),
    });
  }
}