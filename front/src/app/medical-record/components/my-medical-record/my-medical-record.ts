import { Component, inject, OnInit, signal } from '@angular/core';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';

@Component({
  selector: 'app-my-medical-record',
  imports: [],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css',
})
export class MyMedicalRecord implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService)

  fichaMedica = signal<MedicalRecord | null>(null)
  medicaciones = signal<Medication[]>([])

  cargando = signal<boolean>(true)
  cargandoMedicaciones = signal<boolean>(true)

  error = signal<string | null>(null)
  errorMedicaciones = signal<string | null>(null)

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

  ngOnInit(): void {
    this.cargarFichaMedica()
    this.cargarMedicaciones()
  }

}
