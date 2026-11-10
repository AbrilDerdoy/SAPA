import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';
import { Auth } from '../../../Usuario/services/Auth/auth';

@Component({
  selector: 'app-patient-medical-record',
  imports: [RouterLink],
  templateUrl: './patient-medical-record.html',
  styleUrl: './patient-medical-record.css',
})
export class PatientMedicalRecord implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly medicalRecordService = inject(MedicalRecordService);

  readonly auth = inject(Auth);

  patientId = 0;

  fichaMedica = signal<MedicalRecord | null>(null);
  medicaciones = signal<Medication[]>([]);

  cargandoFicha = signal(true);
  cargandoMedicaciones = signal(true);

  errorFicha = signal<string | null>(null);
  errorMedicaciones = signal<string | null>(null);

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('patientId'));

    if (!this.patientId || isNaN(this.patientId)) {
      this.errorFicha.set('El identificador del paciente no es válido.');
      this.cargandoFicha.set(false);
      this.cargandoMedicaciones.set(false);
      return;
    }

    this.cargarFichaMedica();
    this.cargarMedicaciones();
  }

  cargarFichaMedica(): void {
    this.cargandoFicha.set(true);
    this.errorFicha.set(null);

    this.medicalRecordService.getPatientMedicalRecord(this.patientId).subscribe({
      next: (datos) => {
        this.fichaMedica.set(datos);
        this.cargandoFicha.set(false);
      },
      error: () => {
        this.errorFicha.set('No se pudo cargar la ficha médica.');
        this.cargandoFicha.set(false);
      }
    });
  }

  cargarMedicaciones(): void {
    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getPatientMedications(this.patientId).subscribe({
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