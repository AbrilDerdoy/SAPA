import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication, MedicationStatus } from '../../interfaces/medication/medication';
import { Patient } from '../../../Patient/interfaces/patient';
import { PatientService } from '../../../Patient/service/patient.service';
import { MedicationManagement } from '../medication-management/medication-management';
import { Auth } from '../../../Usuario/services/Auth/auth';

@Component({
  selector: 'app-patient-medical-record',
  imports: [RouterLink, MedicationManagement],
  templateUrl: './patient-medical-record.html',
  styleUrl: './patient-medical-record.css',
})
export class PatientMedicalRecord implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly medicalRecordService = inject(MedicalRecordService)
  private readonly patientService = inject(PatientService)
  private readonly auth = inject(Auth)

  patientId = 0
  readonly soloLectura = this.auth.isTutor()

  fichaMedica = signal<MedicalRecord | null>(null)
  medicaciones = signal<Medication[]>([])
  perfilPaciente = signal<Patient | null>(null)
  medicacionEditar = signal<Medication | null>(null)

  cargandoFicha = signal(true)
  cargandoMedicaciones = signal(true)
  cargandoPerfil = signal(true)

  errorFicha = signal<string | null>(null)
  fichaNoRegistrada = signal(false)
  errorMedicaciones = signal<string | null>(null)
  errorPerfil = signal<string | null>(null)

  gestionVisible = signal(false)

  cambiandoEstadoId = signal<number | null>(null)
  errorEstado = signal<string | null>(null)

  medicacionesActivas = computed(() => this.medicaciones().filter(m => m.status === 'PRESCRIBED'))
  medicacionesSuspendidas = computed(() => this.medicaciones().filter(m => m.status === 'SUSPENDED'))

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('patientId'))

    if (!this.patientId || isNaN(this.patientId)) {
      this.errorFicha.set('El identificador del paciente no es válido.')
      this.cargandoFicha.set(false)
      this.cargandoMedicaciones.set(false)
      this.cargandoPerfil.set(false)
      return
    }

    this.cargarFichaMedica()
    this.cargarMedicaciones()
    this.cargarDatosPaciente()
  }

  cargarFichaMedica(): void {
    this.cargandoFicha.set(true)
    this.errorFicha.set(null)
    this.fichaNoRegistrada.set(false)

    this.medicalRecordService.getPatientMedicalRecord(this.patientId).subscribe({
      next: (datos) => {
        this.fichaMedica.set(datos)
        this.cargandoFicha.set(false)
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.fichaMedica.set(null)
          this.fichaNoRegistrada.set(true)
        } else {
          this.errorFicha.set('No se pudo cargar la ficha médica.')
        }
        this.cargandoFicha.set(false)
      }
    })
  }

  cargarMedicaciones(): void {
    this.cargandoMedicaciones.set(true)
    this.errorMedicaciones.set(null)

    this.medicalRecordService.getPatientMedications(this.patientId).subscribe({
      next: (datos) => {
        this.medicaciones.set(datos)
        this.cargandoMedicaciones.set(false)
      },
      error: () => {
        this.errorMedicaciones.set('No se pudieron cargar las medicaciones.')
        this.cargandoMedicaciones.set(false)
      }
    });
  }

  cargarDatosPaciente(): void {
    this.cargandoPerfil.set(true)
    this.errorPerfil.set(null)

    this.patientService.getProfile(this.patientId).subscribe({
      next: (paciente) => {
        this.perfilPaciente.set(paciente)
        this.cargandoPerfil.set(false)
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar los datos del paciente.')
        this.cargandoPerfil.set(false)
      }
    })
  }

  abrirGestion(medicacion?: Medication): void {
    if (this.soloLectura) return

    this.gestionVisible.set(true)
    this.medicacionEditar.set(medicacion ?? null)
  }

  cerrarGestion(): void {
    this.gestionVisible.set(false)
  }

  actualizarLista(): void {
    this.cargarMedicaciones()
  }

  cambiarEstado(medicacion: Medication): void {
    if (this.soloLectura || this.cambiandoEstadoId() !== null) return

    const nuevoEstado: MedicationStatus = medicacion.status === 'PRESCRIBED' ? 'SUSPENDED' : 'PRESCRIBED'

    this.cambiandoEstadoId.set(medicacion.medicationId)
    this.errorEstado.set(null)

    this.medicalRecordService.updateMedication(medicacion.medicationId, { status: nuevoEstado }).subscribe({
      next: () => {
        this.cambiandoEstadoId.set(null)
        this.actualizarLista()
      },
      error: () => {
        this.cambiandoEstadoId.set(null)
        this.errorEstado.set('No se pudo modificar el estado de la medicación.')
      }
    })
  }

}