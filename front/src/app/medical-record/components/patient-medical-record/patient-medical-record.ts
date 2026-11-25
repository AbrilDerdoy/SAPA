import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import {
  Medication,
  MedicationStatus
} from '../../interfaces/medication/medication';
import { Patient } from '../../../Patient/interfaces/patient';
import { PatientService } from '../../../Patient/service/patient.service';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { MedicationManagement } from '../medication-management/medication-management';
import { MedicalRecordMovements } from '../medical-record-movements/medical-record-movements';
import { MedicalRecordAccess } from '../medical-record-access/medical-record-access';

@Component({
  selector: 'app-patient-medical-record',
  standalone: true,
  imports: [
    RouterLink,
    MedicationManagement,
    MedicalRecordMovements,
    MedicalRecordAccess
  ],
  templateUrl: './patient-medical-record.html',
  styleUrl: './patient-medical-record.css'
})
export class PatientMedicalRecord implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly patientService = inject(PatientService);
  readonly auth = inject(Auth);

  readonly soloLectura = this.auth.isTutor();
  patientId = 0;

  readonly fichaMedica = signal<MedicalRecord | null>(null);
  readonly medicaciones = signal<Medication[]>([]);
  readonly perfilPaciente = signal<Patient | null>(null);
  readonly medicacionEditar = signal<Medication | null>(null);

  readonly cargandoFicha = signal(true);
  readonly cargandoMedicaciones = signal(false);
  readonly cargandoPerfil = signal(true);
  readonly errorFicha = signal<string | null>(null);
  readonly fichaNoRegistrada = signal(false);
  readonly errorMedicaciones = signal<string | null>(null);
  readonly errorPerfil = signal<string | null>(null);
  readonly accesoDenegado = signal(false);
  readonly gestionVisible = signal(false);

  readonly cambiandoEstadoId = signal<number | null>(null);
  readonly errorEstado = signal<string | null>(null);
  readonly dialogoEstadoVisible = signal(false);
  readonly medicacionCambioEstado = signal<Medication | null>(null);
  readonly nuevoEstado = signal<MedicationStatus | null>(null);
  readonly justificacionEstado = signal('');

  readonly medicacionesActivas = computed(() =>
    this.medicaciones().filter(m => m.status === 'PRESCRIBED')
  );
  readonly medicacionesSuspendidas = computed(() =>
    this.medicaciones().filter(m => m.status === 'SUSPENDED')
  );
  readonly justificacionValida = computed(() => {
    const length = this.justificacionEstado().trim().length;
    return length >= 5 && length <= 10000;
  });
  readonly accionEstado = computed(() =>
    this.nuevoEstado() === 'SUSPENDED'
      ? 'Suspender medicación'
      : 'Volver a recetar'
  );

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('patientId'));

    if (!Number.isInteger(this.patientId) || this.patientId <= 0) {
      this.errorFicha.set('El identificador del paciente no es válido.');
      this.cargandoFicha.set(false);
      this.cargandoPerfil.set(false);
      return;
    }

    this.cargarDatosPaciente();
    this.cargarFichaMedica();
  }

  cargarFichaMedica(): void {
    this.cargandoFicha.set(true);
    this.errorFicha.set(null);
    this.fichaNoRegistrada.set(false);
    this.accesoDenegado.set(false);
    this.fichaMedica.set(null);

    this.medicalRecordService.getPatientMedicalRecord(this.patientId).subscribe({
      next: record => {
        this.fichaMedica.set(record);
        this.cargandoFicha.set(false);
        this.cargarMedicaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoFicha.set(false);

        if (err.status === 403) {
          this.accesoDenegado.set(true);
          this.medicaciones.set([]);
          this.cargandoMedicaciones.set(false);
        } else if (err.status === 404) {
          this.fichaNoRegistrada.set(true);
        } else {
          this.errorFicha.set(
            err.error?.message ?? 'No se pudo cargar la ficha médica.'
          );
        }
      }
    });
  }

  cargarMedicaciones(): void {
    if (this.accesoDenegado()) {
      return;
    }

    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getPatientMedications(this.patientId).subscribe({
      next: medications => {
        this.medicaciones.set(medications ?? []);
        this.cargandoMedicaciones.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoMedicaciones.set(false);

        if (err.status === 403) {
          this.accesoDenegado.set(true);
          this.medicaciones.set([]);
          this.fichaMedica.set(null);
        } else {
          this.errorMedicaciones.set(
            err.error?.message ?? 'No se pudieron cargar las medicaciones.'
          );
        }
      }
    });
  }

  cargarDatosPaciente(): void {
    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);

    this.patientService.getProfile(this.patientId).subscribe({
      next: patient => {
        this.perfilPaciente.set(patient);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar los datos del paciente.');
        this.cargandoPerfil.set(false);
      }
    });
  }

  abrirGestion(medicacion?: Medication): void {
    if (this.soloLectura || this.accesoDenegado()) {
      return;
    }

    this.medicacionEditar.set(medicacion ?? null);
    this.gestionVisible.set(true);
  }

  cerrarGestion(): void {
    this.gestionVisible.set(false);
    this.medicacionEditar.set(null);
  }

  actualizarLista(): void {
    this.cargarMedicaciones();
  }

  cambiarEstado(medicacion: Medication): void {
    if (
      this.soloLectura ||
      this.accesoDenegado() ||
      this.cambiandoEstadoId() !== null
    ) {
      return;
    }

    this.nuevoEstado.set(
      medicacion.status === 'PRESCRIBED' ? 'SUSPENDED' : 'PRESCRIBED'
    );
    this.medicacionCambioEstado.set(medicacion);
    this.justificacionEstado.set('');
    this.errorEstado.set(null);
    this.dialogoEstadoVisible.set(true);
  }

  cancelarCambioEstado(): void {
    if (this.cambiandoEstadoId() !== null) {
      return;
    }

    this.dialogoEstadoVisible.set(false);
    this.medicacionCambioEstado.set(null);
    this.nuevoEstado.set(null);
    this.justificacionEstado.set('');
    this.errorEstado.set(null);
  }

  confirmarCambioEstado(): void {
    const medication = this.medicacionCambioEstado();
    const status = this.nuevoEstado();
    const justification = this.justificacionEstado().trim();

    if (
      !medication ||
      !status ||
      justification.length < 5 ||
      justification.length > 10000 ||
      this.cambiandoEstadoId() !== null
    ) {
      return;
    }

    this.cambiandoEstadoId.set(medication.medicationId);
    this.errorEstado.set(null);

    this.medicalRecordService.updateMedication(medication.medicationId, {
      status,
      justification
    }).subscribe({
      next: () => {
        this.cambiandoEstadoId.set(null);
        this.cancelarCambioEstado();
        this.actualizarLista();
      },
      error: (err: HttpErrorResponse) => {
        this.cambiandoEstadoId.set(null);

        if (err.status === 403) {
          this.accesoDenegado.set(true);
          this.fichaMedica.set(null);
          this.medicaciones.set([]);
          this.cancelarCambioEstado();
        } else {
          this.errorEstado.set(
            err.error?.message ??
            'No se pudo modificar el estado de la medicación.'
          );
        }
      }
    });
  }
}
