import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../services/Auth/auth';
import { registerRequest } from '../../models/registerRequest';
import { form, minLength, required, FormField, min, applyWhen, validate } from '@angular/forms/signals';
import { FormError } from '../../../Common/form-error/form-error';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { AlertaService } from '../../../Common/alerta/alerta-service';

type RegistroFormModel = Omit<registerRequest, 'licenseNumber'> & {
  licenseNumber: string;
};

function fechaHaceMeses(meses: number): string {
  const fecha = new Date();
  const dia = fecha.getDate();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  fecha.setDate(1);
  fecha.setMonth(fecha.getMonth() - meses);
  const ultimoDiaDelMes = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    0
  ).getDate();
  fecha.setDate(Math.min(dia, ultimoDiaDelMes));
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-registro',
  imports: [FormField,FormError],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css','../../shared/form.css']
})
export class Registro {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly userService = inject(UsuarioService);
  private readonly alerta = inject(AlertaService);
  readonly modelo = signal<RegistroFormModel>({
    role:'ROLE_PATIENT',
    email:'',
    password:'',
    firstName:'',
    lastName:'',
    birthDate:'',
    phoneNumber:'',
    licenseNumber:'',
    speciality:null,
    relationship:''
  });
  readonly fechaMaxima = (() => {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
  })();
  readonly fechaNacimientoMaximaPaciente = fechaHaceMeses(6);
  readonly fechaNacimientoMaximaAdulto = fechaHaceMeses(18 * 12);
  readonly errorRegistro = signal<string | null>(null);
  readonly mostrarPassword = signal(false);
  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.role, {message: 'Selecciona un tipo de usuario'});
    required(ruta.email, {message: 'El email es obligatorio'});
    required(ruta.password, {message: 'La contraseña es obligatoria'});
    minLength(ruta.password, 8, {message: 'La contraseña debe tener al menos 8 caracteres'});
    required(ruta.firstName, {message: 'El nombre es obligatorio'});
    required(ruta.lastName, {message: 'El apellido es obligatorio'});
    required(ruta.birthDate, {message: 'La fecha de nacimiento es obligatoria'});
    validate(ruta.birthDate, ({value, valueOf}) => {
      const fecha = value();

      if (!fecha) {
        return undefined;
      }

      if (fecha >= this.fechaMaxima) {
        return {
          kind: 'past',
          message: 'La fecha de nacimiento debe ser anterior a hoy'
        };
      }

      const rol = valueOf(ruta.role);

      if (rol === 'ROLE_PATIENT' && fecha > this.fechaNacimientoMaximaPaciente) {
        return {
          kind: 'minAgePatient',
          message: 'El paciente debe tener al menos 6 meses de edad para registrarse'
        };
      }

      if (
        (rol === 'ROLE_DOCTOR' || rol === 'ROLE_TUTOR')
        && fecha > this.fechaNacimientoMaximaAdulto
      ) {
        return {
          kind: 'minAgeAdult',
          message: 'El médico y el tutor deben ser mayores de 18 años'
        };
      }

      return undefined;
    });
    required(ruta.phoneNumber, {message: 'El telefono es obligatorio'});
    min(ruta.phoneNumber, 1, {message: 'El telefono debe ser positivo'});
    applyWhen(ruta, ({valueOf}) =>
      valueOf(ruta.role) === 'ROLE_DOCTOR',
    (ruta) => {
      required(ruta.licenseNumber, {message: 'La matricula es obligatoria'});
      required(ruta.speciality, {message: 'La especialidad es obligatoria'});
    }),
    applyWhen(ruta, ({valueOf}) =>
      valueOf(ruta.role) === 'ROLE_TUTOR',
    (ruta) => {
      required(ruta.relationship, {message: 'El parentesco es obligatorio'});
    })
  })

  especialidades = this.userService.specialities;

  alternarVisibilidadPassword(): void {
    this.mostrarPassword.update((visible) => !visible);
  }

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
    this.formulario.relationship().markAsTouched();

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
        speciality: datos.role === 'ROLE_DOCTOR' ? datos.speciality : null,
        relationship: datos.role === 'ROLE_TUTOR' ? datos.relationship : ''
      }

    this.errorRegistro.set(null);
    this.auth.register(registro).subscribe({
      next: (res) => {
        console.log('Registro exitoso', res);

        if (this.modelo().role === 'ROLE_DOCTOR') {
          this.alerta.mostrarInfo(
            'Su cuenta fue creada. Por favor, espera a que un administrador apruebe tu cuenta antes de iniciar sesión',
            'Espere la aprobacion de un administrador'
          );
          this.router.navigate(['/home']);
          return;
        }

        localStorage.setItem('jwt', JSON.stringify(res));

        this.auth.guardarDatosUsuario().subscribe({
          next: (user) => {
            const usuario = {
              id: user.id,
              username: user.username
                || [user.firstName, user.lastName].filter(Boolean).join(' ')
                || user.email,
              email: user.email,
              role: user.role,
              requiresTutor: user.requiresTutor === true
            };

            localStorage.setItem('usuario', JSON.stringify(usuario));
            this.auth.notifySessionChanged();

            // Si es menor de edad, arranca directamente en la gestión de tutela.
            this.router.navigate([usuario.requiresTutor ? '/mi-tutor' : '/home']);
          },
          error: (err) => {
            console.error('No se pudo obtener el usuario registrado:', err);
            this.router.navigate(['/home']);
          }
        });
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
  cambiarTutor(): void {
    this.modelo.update((datos) => ({
      ...datos,
      role: 'ROLE_TUTOR',
      relationship: datos.relationship || ''
    }));
  }

  seleccionarEspecialidad(evento: Event): void {
    const select = evento.target;
    if (!(select instanceof HTMLSelectElement)) return;

    const speciality = select.value === '' ? null : Number(select.value);
    this.modelo.update((datos) => ({...datos, speciality}));
    this.formulario.speciality().markAsTouched();
  }
}
