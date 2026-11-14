import { Component, computed, inject, signal } from '@angular/core';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { form, FormField, required } from '@angular/forms/signals';
import { FormError } from '../../../Common/form-error/form-error';
import { SpecialityDTO } from '../../models/SpecialityDTO';
import { especialidad } from '../../services/Auth/auth';

@Component({
  selector: 'app-panel-admin',
  imports: [FormField,FormError],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin {
  private readonly userService = inject(UsuarioService);

  pendingDoctors = this.userService.getPendingDoctors();
  specialities = this.userService.specialities;

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

  eliminarEspecialidad(especialidad: string): void {
    this.accionError.set(null);
    this.accionMensaje.set(null);

    this.userService.eliminarEspecialidad(especialidad).subscribe({
      next: () => {
        this.accionMensaje.set('Especialidad eliminada correctamente');
        this.specialities.reload();
      },
      error: (error) => {
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
  readonly especialidadEnEdicion = signal<especialidad| null>(null);
  readonly modeloEdicion = signal<SpecialityDTO>({ name: '' });
  readonly formularioEdicion = form(this.modeloEdicion, (especialidad) => {
    required(especialidad.name, { message: 'La especialidad es requerida' });
  });
  readonly guardandoEdicion = signal(false);
  editarEspecialidad(especialidad:especialidad){
    this.accionError.set(null);
    this.accionMensaje.set(null);
    this.especialidadEnEdicion.set(especialidad);
    this.modeloEdicion.set({name:especialidad.name});
  }
  cancelarEdicion():void{
    this.especialidadEnEdicion.set(null);
  }
  guardarEdicion(evento:Event):void{
    evento.preventDefault();
    const enEdicion = this.especialidadEnEdicion();
    if(!enEdicion || this.guardandoEdicion()) return;
    if(this.formularioEdicion().invalid()){
      this.formularioEdicion.name().markAsTouched();
      return;
    }
    const nombre = this.modeloEdicion().name.trim();
    if(nombre === enEdicion.name){
      this.cancelarEdicion();
      return;
    }
    this.guardandoEdicion.set(true);
    this.userService.modificarEspecialidad(enEdicion.id,nombre).subscribe({
      next:()=>{
        this.guardandoEdicion.set(false);
        this.accionMensaje.set('Especialidad modificada correctamente');
        this.cancelarEdicion();
        this.specialities.reload();
      },
      error:(err)=>{
        this.guardandoEdicion.set(false);
        this.accionError.set(this.mensajeDeError(err,'No se pudo modificar la especialidad. Intenta nuevamente.'));
        console.error('Error al modificar especialidad',err);
      }
    });
  }
}
