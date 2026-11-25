
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

  patientId = 0;

  readonly fichaMedica = signal<MedicalRecord | null>(null);
  readonly medicaciones = signal<Medication[]>([]);
  readonly perfilPaciente = signal<Patient | null>(null);
  readonly medicacionEditar = signal<Medication | null>(null);

  readonly cargandoFicha = signal(true);
  readonly cargandoMedicaciones = signal(false);
  readonly cargandoPerfil = signal(true);

  readonly errorFicha = signal<string | null>(null);
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

  readonly justificacionValida = computed(() =>
    this.justificacionEstado().trim().length >= 5 &&
    this.justificacionEstado().trim().length <= 10000
  );

  readonly accionEstado = computed(() =>
    this.nuevoEstado() === 'SUSPENDED'
      ? 'Suspender medicación'
      : 'Volver a recetar'
  );

  ngOnInit(): void {
    this.patientId = Number(
      this.route.snapshot.paramMap.get('patientId')
    );

    if (!Number.isInteger(this.patientId) || this.patientId <= 0) {
      this.errorFicha.set(
        'El identificador del paciente no es válido.'
      );

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
    this.accesoDenegado.set(false);
    this.fichaMedica.set(null);

    this.medicalRecordService
      .getPatientMedicalRecord(this.patientId)
      .subscribe({
        next: datos => {
          this.fichaMedica.set(datos);
          this.cargandoFicha.set(false);
          this.accesoDenegado.set(false);

          this.cargarMedicaciones();
        },
        error: (err: HttpErrorResponse) => {
          this.cargandoFicha.set(false);

          if (err.status === 403) {
            this.accesoDenegado.set(true);
            this.errorFicha.set(null);
            this.medicaciones.set([]);
            this.cargandoMedicaciones.set(false);
          } else {
            this.errorFicha.set(
              err.error?.message ??
              'No se pudo cargar la ficha médica.'
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

    this.medicalRecordService
      .getPatientMedications(this.patientId)
      .subscribe({
        next: datos => {
          this.medicaciones.set(datos ?? []);
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
              err.error?.message ??
              'No se pudieron cargar las medicaciones.'
            );
          }
        }
      });
  }

  cargarDatosPaciente(): void {
    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);

    this.patientService.getMyPatients().subscribe({
      next: datos => {
        const paciente = datos.find(
          item => item.patientId === this.patientId
        );

        if (!paciente) {
          this.errorPerfil.set(
            'No se encontró la información del paciente.'
          );
        } else {
          this.perfilPaciente.set(paciente);
        }

        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.errorPerfil.set(
          'No se pudieron cargar los datos del paciente.'
        );

        this.cargandoPerfil.set(false);
      }
    });
  }

  abrirGestion(medicacion?: Medication): void {
    if (this.accesoDenegado()) {
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
      this.accesoDenegado() ||
      this.cambiandoEstadoId() !== null
    ) {
      return;
    }

    const estado: MedicationStatus =
      medicacion.status === 'PRESCRIBED'
        ? 'SUSPENDED'
        : 'PRESCRIBED';

    this.medicacionCambioEstado.set(medicacion);
    this.nuevoEstado.set(estado);
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
    const medicacion = this.medicacionCambioEstado();
    const estado = this.nuevoEstado();
    const justificacion = this.justificacionEstado().trim();

    if (
      !medicacion ||
      !estado ||
      justificacion.length < 5 ||
      justificacion.length > 10000 ||
      this.cambiandoEstadoId() !== null
    ) {
      return;
    }

    this.cambiandoEstadoId.set(medicacion.medicationId);
    this.errorEstado.set(null);

    this.medicalRecordService
      .updateMedication(medicacion.medicationId, {
        status: estado,
        justification: justificacion
      })
      .subscribe({
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
