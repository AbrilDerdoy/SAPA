import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';
import { PatientService } from '../../../Patient/service/patient.service';
import { Patient } from '../../../Patient/interfaces/patient';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorPatientSelector } from '../../../Tutor/components/tutor-patient-selector/tutor-patient-selector';
import { MedicalRecordMovements } from '../medical-record-movements/medical-record-movements';
import { MedicalRecordAccess } from '../medical-record-access/medical-record-access';

@Component({
  selector: 'app-my-medical-record',
  standalone: true,
  imports: [
    RouterLink,
    TutorPatientSelector,
    MedicalRecordMovements,
    MedicalRecordAccess
  ],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css'
})
export class MyMedicalRecord implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly patientService = inject(PatientService);
  readonly auth = inject(Auth);

  readonly selectedPatientId = signal<number | null>(null);
  readonly activePatientId = computed(() =>
    this.auth.isTutor()
      ? this.selectedPatientId()
      : this.perfil()?.patientId ?? null
  );

  readonly perfil = signal<Patient | null>(null);
  readonly cargandoPerfil = signal(false);
  readonly errorPerfil = signal<string | null>(null);

  readonly fichaMedica = signal<MedicalRecord | null>(null);
  readonly medicaciones = signal<Medication[]>([]);
  readonly medicacionesVisibles = signal(false);
  readonly cargando = signal(true);
  readonly cargandoMedicaciones = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorMedicaciones = signal<string | null>(null);

  readonly medicacionesActivas = computed(() =>
    this.medicaciones().filter(m => m.status === 'PRESCRIBED')
  );

  readonly medicacionesSuspendidas = computed(() =>
    this.medicaciones().filter(m => m.status === 'SUSPENDED')
  );

  ngOnInit(): void {
    if (this.auth.isTutor()) {
      this.cargando.set(false);
      return;
    }

    this.cargarPerfil();
    this.cargarFichaMedica();
  }

  onPatientSelected(patientId: number): void {
    this.selectedPatientId.set(patientId);
    this.perfil.set(null);
    this.cargarPerfil();
    this.cargarFichaMedica();
  }

  cargarPerfil(): void {
    const patientId = this.auth.isTutor()
      ? this.selectedPatientId()
      : null;

    if (this.auth.isTutor() && patientId === null) {
      return;
    }

    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);

    this.patientService.getProfile(patientId).subscribe({
      next: patient => {
        this.perfil.set(patient);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar los datos personales.');
        this.cargandoPerfil.set(false);
      }
    });
  }

  cargarFichaMedica(): void {
    const patientId = this.auth.isTutor()
      ? this.selectedPatientId()
      : null;

    if (this.auth.isTutor() && patientId === null) {
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.medicalRecordService.getMyMedicalRecord(patientId).subscribe({
      next: record => {
        this.fichaMedica.set(record);
        this.cargando.set(false);
      },
      error: err => {
        this.error.set(
          err?.error?.message ?? 'No se pudo cargar la ficha médica.'
        );
        this.cargando.set(false);
      }
    });
  }

  cargarMedicaciones(): void {
    const patientId = this.auth.isTutor()
      ? this.selectedPatientId()
      : null;

    if (this.auth.isTutor() && patientId === null) {
      return;
    }

    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getMyMedications(patientId).subscribe({
      next: medications => {
        this.medicaciones.set(medications ?? []);
        this.cargandoMedicaciones.set(false);
      },
      error: err => {
        this.errorMedicaciones.set(
          err?.error?.message ?? 'No se pudieron cargar las medicaciones.'
        );
        this.cargandoMedicaciones.set(false);
      }
    });
  }

  toggleMedicaciones(): void {
    const mostrar = !this.medicacionesVisibles();
    this.medicacionesVisibles.set(mostrar);

    if (mostrar) {
      this.cargarMedicaciones();
    }
  }
}
