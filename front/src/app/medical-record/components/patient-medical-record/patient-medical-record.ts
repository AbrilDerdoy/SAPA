import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecord } from '../../interfaces/medical-record';
import { Medication } from '../../interfaces/medication/medication';
import { AddMedicationRequest } from '../../interfaces/medication/add-medication-request';
import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { MedicationSearch } from '../../../Medication/components/medication-search/medication-search';

@Component({
  selector: 'app-patient-medical-record',
  imports: [RouterLink, FormField, MedicationSearch],
  templateUrl: './patient-medical-record.html',
  styleUrl: './patient-medical-record.css',
})
export class PatientMedicalRecord implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly medicalRecordService = inject(MedicalRecordService);

  medicamentoSeleccionado = signal('');
  @ViewChild('buscador') buscador!: MedicationSearch
  patientId = 0;

  fichaMedica = signal<MedicalRecord | null>(null);
  medicaciones = signal<Medication[]>([]);

  cargandoFicha = signal(true);
  cargandoMedicaciones = signal(true);

  errorFicha = signal<string | null>(null);
  errorMedicaciones = signal<string | null>(null);

  private obtenerFechaActual(): string {
    const fecha = new Date();

    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');
  }

  // Forrmulario
  modeloMedicacion = signal<AddMedicationRequest>({
    fdaDrugName: '',
    notes: '',
    startDate: '',
    endDate: ''
  })

  formularioMedicacion = form(this.modeloMedicacion, (path) => {
    required(path.fdaDrugName, { message: 'El nombre del medicamento es obligatorio.' })
    required(path.startDate, { message: 'La fecha de inicio es obligatoria.' })
    minLength(path.fdaDrugName, 3, { message: 'El nombre no debe tener más de 150 caracteres.' })
    maxLength(path.fdaDrugName, 50, { message: 'El nombre no puede tener más de 50 caracteres.' })
    maxLength(path.notes, 1000, { message: 'Las notas no pueden superar los 1000 caracteres.' })
    required(path.startDate, { message: 'La fecha de inicio es obligatoria.' })
    validate(path.startDate, ({ value }) => {
      const fecha = value();

      if (fecha && fecha < this.obtenerFechaActual()) {
        return {
          kind: 'minDate',
          message: 'La fecha de inicio debe ser hoy o posterior.'
        };
      }

      return null;
    });
    validate(path.endDate, ({ value }) => {
      const fechaFin = value();
      const fechaInicio = this.modeloMedicacion().startDate;

      if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
        return {
          kind: 'invalidDate',
          message: 'La fecha de finalización no puede ser anterior a la fecha de inicio.'
        };
      }

      return null;
    });
  })

  mostrarForm = signal(false)
  guardandoMedicacion = signal(false)
  errorForm = signal<string | null>(null)
  exitoForm = signal(false)

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

  abrirForm(): void {
    this.errorForm.set(null)
    this.exitoForm.set(false)
    this.mostrarForm.set(true)
  }

  cancelarForm(): void {
    this.mostrarForm.set(false)
    this.resetForm()
  }

  seleccionarMedicamento(nombre: string): void {
    // this.medicamentoSeleccionado.set(nombre);

    this.modeloMedicacion.update(modelo => ({
      ...modelo,
      fdaDrugName: nombre
    }));

    this.mostrarForm.set(true);
  }

  agregarMedicamento(): void {
    const datos = this.modeloMedicacion()

    if (this.formularioMedicacion().invalid()) return

    if (datos.endDate && datos.endDate < datos.startDate) {
      this.errorForm.set('La fecha de finalización no puede ser anterior a la fecha de inicio.')
      return
    }

    const nuevoMedicamento: AddMedicationRequest = {
      ...datos,
      notes: datos.notes.trim(),
      endDate: datos.endDate
    }

    this.guardandoMedicacion.set(true)
    this.errorForm.set(null)

    this.medicalRecordService.addMedication(this.patientId, nuevoMedicamento).subscribe({
      next: (medicacion) => {
        this.medicaciones.update(actuales => [...actuales, medicacion])

        this.guardandoMedicacion.set(false)
        this.exitoForm.set(true)
        this.mostrarForm.set(false)
        this.buscador.reset()
        this.resetForm()
      },
      error: () => {
        this.guardandoMedicacion.set(false)
        this.errorForm.set('No se pudo registrar la medicación.')
      }
    })
  }

  private resetForm(): void {
    this.modeloMedicacion.set({
      fdaDrugName: '',
      notes: '',
      startDate: new Date().toLocaleDateString('en-CA'),
      endDate: ''
    });
  }

}