
import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';

import { PatientService } from '../../../Patient/service/patient.service';
import { Patient } from '../../../Patient/interfaces/patient';

import { MedicalRecordMovements } from '../medical-record-movements/medical-record-movements';
import { MedicalRecordAccess } from '../medical-record-access/medical-record-access';

@Component({
  selector: 'app-my-medical-record',
  standalone: true,
  imports: [
    RouterLink,
    MedicalRecordMovements,
    MedicalRecordAccess
  ],
  templateUrl: './my-medical-record.html',
  styleUrl: './my-medical-record.css'
})
export class MyMedicalRecord implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly patientService = inject(PatientService);

  readonly perfil = signal<Patient | null>(null);
  readonly cargandoPerfil = signal(true);
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
    this.cargarPerfil();
    this.cargarFichaMedica();
  }

  cargarPerfil(): void {
    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);

    this.patientService.getProfile().subscribe({
      next: datos => {
        this.perfil.set(datos);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar tus datos personales.');
        this.cargandoPerfil.set(false);
      }
    });
  }

  cargarFichaMedica(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.medicalRecordService.getMyMedicalRecord().subscribe({
      next: datos => {
        this.fichaMedica.set(datos);
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
    this.cargandoMedicaciones.set(true);
    this.errorMedicaciones.set(null);

    this.medicalRecordService.getMyMedications().subscribe({
      next: datos => {
        this.medicaciones.set(datos ?? []);
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
