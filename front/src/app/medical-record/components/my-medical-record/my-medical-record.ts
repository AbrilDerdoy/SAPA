import { Component, inject, OnInit, signal } from '@angular/core';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { TutorPatientSelector } from '../../../Tutor/components/tutor-patient-selector/tutor-patient-selector';

@Component({
  selector: 'app-my-medical-record',
  imports: [TutorPatientSelector],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css',
})
export class MyMedicalRecord implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService)

  readonly auth = inject(Auth);

  readonly selectedPatientId = signal<number | null>(null);

  fichaMedica = signal<MedicalRecord | null>(null)
  medicaciones = signal<Medication[]>([])

  cargando = signal<boolean>(true)
  cargandoMedicaciones = signal<boolean>(true)

  error = signal<string | null>(null)
  errorMedicaciones = signal<string | null>(null)

  ngOnInit(): void {
    if (this.auth.isTutor()) {
      this.cargando.set(false);
      this.cargandoMedicaciones.set(false);
      return;
    }

    this.cargarFichaMedica()
    this.cargarMedicaciones()
  }

  onPatientSelected(patientId: number): void {
    this.selectedPatientId.set(patientId);
    this.cargarFichaMedica();
    this.cargarMedicaciones();
  }

  cargarFichaMedica(): void {
    if (this.auth.isTutor() && this.selectedPatientId() === null) return;

    this.cargando.set(true)
    this.error.set(null)

    this.medicalRecordService.getMyMedicalRecord(this.selectedPatientId()).subscribe({
      next: (datos) => {
        this.fichaMedica.set(datos)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo cargar la ficha médica.')
        this.cargando.set(false)
      }
    })
  }

  cargarMedicaciones(): void {
    if (this.auth.isTutor() && this.selectedPatientId() === null) return;

    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getMyMedications(this.selectedPatientId()).subscribe({
      next: (datos) => {
        this.medicaciones.set(datos);
        this.cargandoMedicaciones.set(false);
      },
      error: () => {
        this.errorMedicaciones.set('No se pudieron cargar las medicaciones.');
        this.cargandoMedicaciones.set(false);
      }
    });
  }

}
