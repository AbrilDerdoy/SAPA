import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import {
  PatientProfile,
  PatientService,
} from '../../../Usuario/services/Patient/patient.service';

@Component({
  selector: 'app-tutor-patient-profile',
  imports: [RouterLink],
  templateUrl: './tutor-patient-profile.html',
  styleUrl: './tutor-patient-profile.css',
})
export class TutorPatientProfile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly alerta = inject(AlertaService);

  readonly patient = signal<PatientProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly birthDate = signal('');
  readonly phoneNumber = signal('');

  private patientId: number | null = null;

  ngOnInit(): void {
    const patientId = Number(this.route.snapshot.paramMap.get('patientId'));

    if (!Number.isFinite(patientId) || patientId <= 0) {
      this.error.set('El identificador del paciente no es válido.');
      this.loading.set(false);
      return;
    }

    this.patientId = patientId;
    this.loadPatient();
  }

  loadPatient(): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientService.getProfile(this.patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.firstName.set(patient.firstName ?? '');
        this.lastName.set(patient.lastName ?? '');
        this.birthDate.set((patient.birthDate ?? '').slice(0, 10));
        this.phoneNumber.set(patient.phoneNumber ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos del paciente.');
        this.loading.set(false);
      },
    });
  }

  updateField(field: 'firstName' | 'lastName' | 'birthDate' | 'phoneNumber', event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    switch (field) {
      case 'firstName':
        this.firstName.set(input.value);
        break;
      case 'lastName':
        this.lastName.set(input.value);
        break;
      case 'birthDate':
        this.birthDate.set(input.value);
        break;
      case 'phoneNumber':
        this.phoneNumber.set(input.value);
        break;
    }
  }

  save(event: Event): void {
    event.preventDefault();

    if (this.saving()) {
      return;
    }

    if (!this.firstName().trim() || !this.lastName().trim() || !this.phoneNumber().trim()) {
      this.error.set('Completá nombre, apellido y teléfono.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.patientService.updateProfile(this.patientId, {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      birthDate: this.birthDate(),
      phoneNumber: this.phoneNumber().trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.alerta.mostrarInfo(
          'Los datos del paciente fueron actualizados.',
          'Cambios registrados',
        );
        this.loadPatient();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.extractError(error));
      },
    });
  }

  private extractError(error: HttpErrorResponse): string {
    const body = error.error;

    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }

    if (body && typeof body === 'object') {
      const message = Reflect.get(body, 'message');

      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }

    return 'No se pudieron guardar los cambios. Intentá nuevamente.';
  }
}
