import { Component, inject, OnInit, signal } from '@angular/core';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { flattenDiagnosticMessageText } from 'typescript';

@Component({
  selector: 'app-my-medical-record',
  imports: [],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css',
})
export class MyMedicalRecord implements OnInit{
  private readonly medicalRecordService = inject(MedicalRecordService)

  fichaMedica = signal<MedicalRecord | null>(null)
  cargando = signal<boolean>(true)
  error = signal<string | null>(null)

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

  ngOnInit(): void {
    this.cargarFichaMedica()
  }

}
