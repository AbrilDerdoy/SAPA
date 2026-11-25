
import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import { AddMedicationRequest } from '../../interfaces/medication/add-medication-request';
import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { Medication } from '../../interfaces/medication/medication';
import { UpdateMedicationRequest } from '../../interfaces/medication/update-medication-request';
import { MedicationSearch } from '../../../Medication/components/medication-search/medication-search';
import { MedicalRecordService } from '../../services/medical-record-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-medication-management',
    imports: [FormField, MedicationSearch],
    templateUrl: './medication-management.html',
    styleUrl: './medication-management.css',
})
export class MedicationManagement {
    private readonly medicalRecordService = inject(MedicalRecordService);

    patientId = input.required<number>();
    medicacion = input<Medication | null>(null);

    saved = output<void>();
    closed = output<void>();

    buscador = viewChild<MedicationSearch>('buscador');

    medicamentoSeleccionado = signal('');

    editandoId = signal<number | null>(null);
    mostrarForm = signal(false);

    guardandoMedicacion = signal(false);
    errorForm = signal<string | null>(null);
    exitoForm = signal(false);

    modeloMedicacion = signal<AddMedicationRequest>({
        fdaDrugName: '',
        notes: '',
        startDate: this.obtenerFechaActual(),
        endDate: '',
        justification: ''
    });

    formularioMedicacion = form(this.modeloMedicacion, (path) => {
        required(path.fdaDrugName, {
            message: 'El nombre del medicamento es obligatorio.'
        });

        minLength(path.fdaDrugName, 3, {
            message: 'El nombre debe tener al menos 3 caracteres.'
        });

        maxLength(path.fdaDrugName, 150, {
            message: 'El nombre no puede superar los 150 caracteres.'
        });

        maxLength(path.notes, 1000, {
            message: 'Las notas no pueden superar los 1000 caracteres.'
        });

        required(path.startDate, {
            message: 'La fecha de inicio es obligatoria.'
        });

        validate(path.startDate, ({ value }) => {
            const fecha = value();

            if (!this.editandoId() && fecha && fecha < this.obtenerFechaActual()) {
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

        required(path.justification, {
            message: 'La justificación del movimiento es obligatoria.'
        });

        minLength(path.justification, 5, {
            message: 'La justificación debe tener al menos 5 caracteres.'
        });

        maxLength(path.justification, 10000, {
            message: 'La justificación no puede superar los 10000 caracteres.'
        });
    });

    private obtenerFechaActual(): string {
        const fecha = new Date();

        return [
            fecha.getFullYear(),
            String(fecha.getMonth() + 1).padStart(2, '0'),
            String(fecha.getDate()).padStart(2, '0')
        ].join('-');
    }

    abrirForm(): void {
        this.resetForm();
        this.editandoId.set(null);
        this.buscador()?.reset();
        this.errorForm.set(null);
        this.exitoForm.set(false);
        this.mostrarForm.set(true);
    }

    cancelarForm(): void {
        if (this.guardandoMedicacion()) return;

        this.mostrarForm.set(false);
        this.editandoId.set(null);
        this.errorForm.set(null);
        this.buscador()?.reset();
        this.resetForm();
    }

    cerrarGestion(): void {
        if (this.guardandoMedicacion()) return;

        this.cancelarForm();
        this.closed.emit();
    }

    seleccionarMedicamento(nombre: string): void {
        this.modeloMedicacion.update(modelo => ({
            ...modelo,
            fdaDrugName: nombre
        }));
    }

    editarMedicacion(medicacion: Medication): void {
        this.editandoId.set(medicacion.medicationId);

        this.modeloMedicacion.set({
            fdaDrugName: medicacion.fdaDrugName,
            notes: medicacion.notes ?? '',
            startDate: medicacion.startDate,
            endDate: medicacion.endDate ?? '',
            justification: ''
        });

        this.errorForm.set(null);
        this.exitoForm.set(false);
        this.mostrarForm.set(true);
    }

    guardarMedicacion(): void {
        if (this.formularioMedicacion().invalid()) return;

        const justificacion = this.modeloMedicacion().justification.trim();

        if (justificacion.length < 5) {
            this.errorForm.set(
                'Ingresá una justificación de al menos 5 caracteres.'
            );
            return;
        }

        if (this.editandoId() !== null) {
            this.actualizarMedicacion();
        } else {
            this.agregarMedicacion();
        }
    }

    private agregarMedicacion(): void {
        const datos = this.modeloMedicacion();

        const nuevaMedicacion: AddMedicationRequest = {
            fdaDrugName: datos.fdaDrugName.trim(),
            notes: datos.notes.trim(),
            startDate: datos.startDate,
            endDate: datos.endDate,
            justification: datos.justification.trim()
        };

        this.guardandoMedicacion.set(true);
        this.errorForm.set(null);

        this.medicalRecordService.addMedication(
            this.patientId(),
            nuevaMedicacion
        ).subscribe({
            next: () => {
                this.finalizarGuardado();
            },
            error: (error: HttpErrorResponse) => {
                this.manejarError(error, 'registrar');
            }
        });
    }

    private actualizarMedicacion(): void {
        const datos = this.modeloMedicacion();
        const medicationId = this.editandoId();

        if (medicationId === null) return;

        const actualizacion: UpdateMedicationRequest = {
            notes: datos.notes.trim(),
            startDate: datos.startDate,
            endDate: datos.endDate || undefined,
            justification: datos.justification.trim()
        };

        this.guardandoMedicacion.set(true);
        this.errorForm.set(null);

        this.medicalRecordService.updateMedication(
            medicationId,
            actualizacion
        ).subscribe({
            next: () => {
                this.finalizarGuardado();
            },
            error: (error: HttpErrorResponse) => {
                this.manejarError(error, 'actualizar');
            }
        });
    }

    private manejarError(
        error: HttpErrorResponse,
        accion: string
    ): void {
        this.guardandoMedicacion.set(false);

        const mensaje = error.error?.message;

        this.errorForm.set(
            mensaje || `No se pudo ${accion} la medicación.`
        );
    }

    private finalizarGuardado(): void {
        this.guardandoMedicacion.set(false);
        this.mostrarForm.set(false);
        this.editandoId.set(null);
        this.buscador()?.reset();
        this.resetForm();

        this.exitoForm.set(true);
        this.saved.emit();
    }

    private resetForm(): void {
        this.modeloMedicacion.set({
            fdaDrugName: '',
            notes: '',
            startDate: this.obtenerFechaActual(),
            endDate: '',
            justification: ''
        });
    }

    ngOnInit(): void {
        const medicacion = this.medicacion();

        if (medicacion) {
            this.editarMedicacion(medicacion);
        }
    }
}
