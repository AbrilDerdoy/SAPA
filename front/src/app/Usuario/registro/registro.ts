import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../service/auth';
import { registerRequest } from '../interfaces/registerRequest';
import { form, minLength, required, FormField, min, applyWhen, validate } from '@angular/forms/signals';
import { FormError } from '../../Common/form-error/form-error';
import { Router } from '@angular/router';

type RegistroFormModel = Omit<registerRequest, 'licenseNumber' | 'specialities'> & {
  licenseNumber: string;
  speciality: number | null;
};

@Component({
  selector: 'app-registro',
  imports: [FormField,FormError],
  templateUrl: './registro.html',
  styleUrl: '../shared/form.css',
})
export class Registro {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  readonly modelo = signal<RegistroFormModel>({
    role:null,
    email:'',
    password:'',
    firstName:'',
    lastName:'',
    birthDate:'',
    phoneNumber:'',
    licenseNumber:'',
    speciality:null
  });
  readonly fechaMaxima = (() => {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
  })();
  readonly errorRegistro = signal<string | null>(null);
  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.role, {message: 'Selecciona un tipo de usuario'});
    required(ruta.email, {message: 'El email es obligatorio'});
    required(ruta.password, {message: 'La contraseña es obligatoria'});
    minLength(ruta.password, 8, {message: 'La contraseña debe tener al menos 8 caracteres'});
    required(ruta.firstName, {message: 'El nombre es obligatorio'});
    required(ruta.lastName, {message: 'El apellido es obligatorio'});
    required(ruta.birthDate, {message: 'La fecha de nacimiento es obligatoria'});
    validate(ruta.birthDate, ({value}) =>
      value() >= this.fechaMaxima
        ? {kind: 'past', message: 'La fecha de nacimiento debe ser anterior a hoy'}
        : undefined
    );
    required(ruta.phoneNumber, {message: 'El telefono es obligatorio'});
    min(ruta.phoneNumber, 1, {message: 'El telefono debe ser positivo'});
    applyWhen(ruta, ({valueOf}) =>
      valueOf(ruta.role) === 'ROLE_DOCTOR',
    (ruta) => {
      required(ruta.licenseNumber, {message: 'La matricula es obligatoria'});
      required(ruta.speciality, {message: 'La especialidad es obligatoria'});
    })
  })

  especialidades = this.auth.specialities;

  enviar(evento: Event): void {
    evento.preventDefault();

    this.formulario.role().markAsTouched();
    this.formulario.firstName().markAsTouched();
    this.formulario.lastName().markAsTouched();
    this.formulario.email().markAsTouched();
    this.formulario.password().markAsTouched();
    this.formulario.birthDate().markAsTouched();
    this.formulario.phoneNumber().markAsTouched();
    this.formulario.licenseNumber().markAsTouched();
    this.formulario.speciality().markAsTouched();

    if (this.formulario().invalid()) return;

    const datos = this.modelo();

    const registro: registerRequest = {
        role: datos.role,
        firstName:datos.firstName,
        lastName:datos.lastName,
        email:datos.email,
        password:datos.password,
        phoneNumber:datos.phoneNumber,
        birthDate:datos.birthDate,
        licenseNumber: datos.role === 'ROLE_DOCTOR' ? datos.licenseNumber : null,
        specialities: datos.role === 'ROLE_DOCTOR' && datos.speciality !== null
          ? [datos.speciality]
          : null
      }

    this.errorRegistro.set(null);
    this.auth.register(registro).subscribe({
      next: (res) => {
        console.log('Registro exitoso', res);
        localStorage.setItem('jwt',JSON.stringify(res));  
        this.auth.guardarDatosUsuario()              
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        const detalle = this.mensajeError(err);
        this.errorRegistro.set(detalle);
        console.error('Error al registrarse', err);
      }
    });
  }

  private mensajeError(error: HttpErrorResponse): string {
    const body = error.error;
    const parsedBody = typeof body === 'string' ? this.parseJsonBody(body) : body;
    const message = this.extractErrorMessage(parsedBody);
    if (message) return message;
    if (typeof body === 'string' && !this.looksLikeJson(body)) return body;

    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica que esté disponible.';
    return `No se pudo completar el registro (HTTP ${error.status}).`;
  }

  private parseJsonBody(body: string): unknown {
    if (!this.looksLikeJson(body)) return null;

    try {
      return JSON.parse(body) as unknown;
    } catch (error) {
      console.error('No se pudo interpretar la respuesta JSON del servidor', error);
      return null;
    }
  }

  private looksLikeJson(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  }

  private extractErrorMessage(body: unknown): string | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

    for (const key of ['message', 'detail', 'title']) {
      const value: unknown = Reflect.get(body, key);
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  cambiarPaciente(): void {
    this.modelo.update((datos) => ({...datos, role: 'ROLE_PATIENT'}));
  }    
  cambiarMedico(): void {
    this.modelo.update((datos) => ({...datos, role: 'ROLE_DOCTOR'}));
  }

  seleccionarEspecialidad(evento: Event): void {
    const select = evento.target;
    if (!(select instanceof HTMLSelectElement)) return;

    const speciality = select.value === '' ? null : Number(select.value);
    this.modelo.update((datos) => ({...datos, speciality}));
    this.formulario.speciality().markAsTouched();
  }
}
