import { Component, inject, OnInit, signal } from '@angular/core';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';
import { PatientService } from '../../../Patient/service/patient.service';
import { Patient } from '../../../Patient/interfaces/patient';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-medical-record',
  imports: [RouterLink],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css',
})
export class MyMedicalRecord implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService)
  private readonly patientService = inject(PatientService)

  perfil =signal<Patient | null>(null)
  cargandoPerfil = signal(true)
  errorPerfil = signal<string | null>(null)

  fichaMedica = signal<MedicalRecord | null>(null)
  medicaciones = signal<Medication[]>([])
  medicacionesVisibles = signal(false)

  cargando = signal<boolean>(true)
  cargandoMedicaciones = signal<boolean>(true)

  error = signal<string | null>(null)
  errorMedicaciones = signal<string | null>(null)

  cargarPerfil(): void {
    this,this.cargandoPerfil.set(true)
    this.errorPerfil.set(null)

    this.patientService.getProfile().subscribe({
      next: (datos) => {
        this.perfil.set(datos)
        this.cargandoPerfil.set(false)
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar tus datos personales.')
        this.cargandoPerfil.set(false)
      }
    })
  }

  cargarFichaMedica(): void {
    this.cargando.set(true)
    this.error.set(null)

    this.medicalRecordService.getMyMedicalRecord().subscribe({
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
    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getMyMedications().subscribe({
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

  toggleMedicaciones(): void {
  const mostrar = !this.medicacionesVisibles();
  this.medicacionesVisibles.set(mostrar);

  if (mostrar && !this.medicaciones().length) {
    this.cargarMedicaciones();
  }
}

  ngOnInit(): void {
    this.cargarPerfil()
    this.cargarFichaMedica()
  }

}
