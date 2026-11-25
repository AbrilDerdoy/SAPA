import { Component, computed, inject, signal } from '@angular/core';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { form, FormField, required } from '@angular/forms/signals';
import { FormError } from '../../../Common/form-error/form-error';
import { SpecialityDTO } from '../../models/SpecialityDTO';
import { especialidad } from '../../services/Auth/auth';
import { ReportService } from '../../../report/report-services/report-service';
import { ReportResponse } from '../../../report/report-DTOs/report-response';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-admin',
  imports: [FormField, FormError, DatePipe, RouterLink],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin {
  private readonly userService = inject(UsuarioService);
  private readonly reportService = inject(ReportService)

  pendingDoctors = this.userService.getPendingDoctors();
  specialities = this.userService.specialities;

  cantidadPendientes = computed(() => this.pendingDoctors.hasValue() ? this.pendingDoctors.value().length : 0);
  readonly accionError = signal<string | null>(null);
  readonly accionMensaje = signal<string | null>(null);
  readonly solicitudesEnProceso = signal<ReadonlySet<number>>(new Set());

  // Reportes
  readonly reports = signal<ReportResponse[]>([])
  readonly reportsLoading = signal(false)
  readonly reportsError = signal<string | null>(null)

  readonly reportTab = signal<'PENDING' | 'REVIEWED'>('PENDING')

  readonly pendingReports = computed(() =>
    this.reports().filter(report => !report.reviewed)
  )

  readonly reviewedReports = computed(() =>
    this.reports().filter(report => report.reviewed)
  )

  readonly displayedReports = computed(() =>
    this.reportTab() === 'PENDING'
      ? this.pendingReports()
      : this.reviewedReports()
  )

  readonly cantidadReportes = computed(
    () => this.pendingReports().length
  )

  readonly recentReports = computed(() =>
    [...this.reports()]
      .sort((a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      )
      .slice(0, 2)
  )

  //
  constructor() {
    this.loadReports()
  }


  aceptarSolicitud(userId: number) {
    this.gestionarSolicitud(userId, 'aceptar');
  }

  rechazarSolicitud(userId: number) {
    this.gestionarSolicitud(userId, 'rechazar');
  }

  private gestionarSolicitud(userId: number, accion: 'aceptar' | 'rechazar'): void {
    if (this.solicitudesEnProceso().has(userId)) {
      return;
    }

    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.solicitudesEnProceso.update((ids) => new Set(ids).add(userId));

    const solicitud = accion === 'aceptar'
      ? this.userService.aceptarSolicitud(userId)
      : this.userService.rechazarSolicitud(userId);

    solicitud.subscribe({
      next: () => {
        this.solicitudesEnProceso.update((ids) => {
          const actualizadas = new Set(ids);
          actualizadas.delete(userId);
          return actualizadas;
        });
        this.accionMensaje.set(
          accion === 'aceptar' ? 'La solicitud fue aceptada.' : 'La solicitud fue rechazada.'
        );
        this.pendingDoctors.reload();
      },
      error: (error: unknown) => {
        this.solicitudesEnProceso.update((ids) => {
          const actualizadas = new Set(ids);
          actualizadas.delete(userId);
          return actualizadas;
        });
        this.accionError.set(
          accion === 'aceptar'
            ? 'No se pudo aceptar la solicitud. Intenta nuevamente.'
            : 'No se pudo rechazar la solicitud. Intenta nuevamente.'
        );
        console.error(`Error al ${accion} la solicitud del usuario ${userId}`, error);
      }
    });
  }

  readonly modelo = signal<SpecialityDTO>({ name: '' });
  readonly formulario = form(this.modelo, (especialidad) => {
    required(especialidad.name, { message: 'La especialidad es requerida' });
  });
  readonly procesandoEspecialidad = signal(false);

  agregarEspecialidad(evento: Event): void {
    evento.preventDefault();
    if (this.procesandoEspecialidad()) return;

    if (this.formulario().invalid()) {
      this.formulario.name().markAsTouched();
      return;
    }

    const nombre = this.modelo().name.trim();
    const especialidad: SpecialityDTO = { name: nombre };

    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.procesandoEspecialidad.set(true);

    this.userService.agregarEspecialidad(especialidad).subscribe({
      next: () => {
        this.procesandoEspecialidad.set(false);
        this.accionMensaje.set('Especialidad agregada correctamente');
        this.modelo.set({ name: '' });
        this.formulario.name().reset();
        this.specialities.reload();
      },
      error: (error) => {
        this.procesandoEspecialidad.set(false);
        this.accionError.set(this.mensajeDeError(error, 'No se pudo agregar la especialidad. Intenta nuevamente.'));
        console.error('Error al agregar especialidad', error);
      }
    });
  }

  readonly especialidadPorEliminar = signal<number | null>(null);
  readonly eliminandoEspecialidad = signal(false);

  pedirConfirmacionEliminar(id: number): void {
    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.especialidadPorEliminar.set(id);
  }

  cancelarEliminacion(): void {
    this.especialidadPorEliminar.set(null);
  }

  eliminarEspecialidad(especialidad: string): void {
    if (this.eliminandoEspecialidad()) return;

    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.eliminandoEspecialidad.set(true);

    this.userService.eliminarEspecialidad(especialidad).subscribe({
      next: () => {
        this.eliminandoEspecialidad.set(false);
        this.especialidadPorEliminar.set(null);
        this.accionMensaje.set('Especialidad eliminada correctamente');
        this.specialities.reload();
      },
      error: (error) => {
        this.eliminandoEspecialidad.set(false);
        this.especialidadPorEliminar.set(null);
        this.accionError.set(this.mensajeDeError(error, 'No se pudo eliminar la especialidad. Intenta nuevamente.'));
        console.error('Error al eliminar especialidad', error);
      }
    });
  }

  private mensajeDeError(error: unknown, predeterminado: string): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const body = (error as { error?: unknown }).error;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) return message;
      }
    }
    return predeterminado;
  }
  readonly especialidadEnEdicion = signal<especialidad | null>(null);
  readonly modeloEdicion = signal<SpecialityDTO>({ name: '' });
  readonly formularioEdicion = form(this.modeloEdicion, (especialidad) => {
    required(especialidad.name, { message: 'La especialidad es requerida' });
  });
  readonly guardandoEdicion = signal(false);
  editarEspecialidad(especialidad: especialidad) {
    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.especialidadPorEliminar.set(null);
    this.especialidadEnEdicion.set(especialidad);
    this.modeloEdicion.set({ name: especialidad.name });
  }
  cancelarEdicion(): void {
    this.especialidadEnEdicion.set(null);
  }
  guardarEdicion(evento: Event): void {
    evento.preventDefault();
    const enEdicion = this.especialidadEnEdicion();
    if (!enEdicion || this.guardandoEdicion()) return;
    if (this.formularioEdicion().invalid()) {
      this.formularioEdicion.name().markAsTouched();
      return;
    }
    const nombre = this.modeloEdicion().name.trim();
    if (nombre === enEdicion.name) {
      this.cancelarEdicion();
      return;
    }
    this.guardandoEdicion.set(true);
    this.userService.modificarEspecialidad(enEdicion.id, nombre).subscribe({
      next: () => {
        this.guardandoEdicion.set(false);
        this.accionMensaje.set('Especialidad modificada correctamente');
        this.cancelarEdicion();
        this.specialities.reload();
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.accionError.set(this.mensajeDeError(err, 'No se pudo modificar la especialidad. Intenta nuevamente.'));
        console.error('Error al modificar especialidad', err);
      }
    });
  }

  loadReports(): void {
    this.reportsLoading.set(true)
    this.reportsError.set(null)

    this.reportService.getAllReports().subscribe({
      next: reports => {
        this.reports.set(reports)
        this.reportsLoading.set(false)
      },
      error: error => {
        this.reportsError.set('No se pudieron cargar los reportes.')
        this.reportsLoading.set(false)
      }
    });
  }

  markAsReviewed(reportId: number): void {
    this.reportService.markAsReviewed(reportId).subscribe({
      next: updatedReport => {
        this.reports.update(reports =>
          reports.map(report =>
            report.reportId === updatedReport.reportId
              ? updatedReport
              : report
          )
        )
      },
      error: error => {
        this.reportsError.set('No se pudo actualizar el reporte.')
      }
    })
  }
}