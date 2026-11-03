import { Component, computed, inject, signal } from '@angular/core';
import { UsuarioService } from '../../services/Usuario/usuario-service';

@Component({
  selector: 'app-panel-admin',
  imports: [],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin {
  private readonly userService = inject(UsuarioService);

  pendingDoctors = this.userService.pendingDoctors;

  cantidadPendientes = computed(()=> this.pendingDoctors.hasValue() ? this.pendingDoctors.value().length : 0);
  readonly accionError = signal<string | null>(null);
  readonly accionMensaje = signal<string | null>(null);
  readonly solicitudesEnProceso = signal<ReadonlySet<number>>(new Set());

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
}
