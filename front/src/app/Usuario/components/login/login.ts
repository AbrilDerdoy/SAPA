
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../services/Auth/auth';
import { loginRequest } from '../../models/loginRequest';
import {
  form,
  minLength,
  required,
  FormField,
  email
} from '@angular/forms/signals';
import { FormError } from '../../../Common/form-error/form-error';
import { Router, RouterLink } from '@angular/router';
import { AlertaService } from '../../../Common/alerta/alerta-service';

@Component({
  selector: 'app-login',
  imports: [FormField, FormError, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../../shared/form.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly alerta = inject(AlertaService);

  readonly modelo = signal<loginRequest>({
    email: '',
    password: ''
  });

  readonly aviso = signal<{ tipo: 'info' | 'error'; texto: string } | null>(null);

  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.email, { message: 'El email es obligatorio' });
    email(ruta.email, { message: 'Debe ingresar un email valido' });
    required(ruta.password, { message: 'La contraseña es obligatoria' });
    minLength(ruta.password, 8, {
      message: 'La contraseña debe tener al menos 8 caracteres'
    });
  });

  enviar(evento: Event): void {
    evento.preventDefault();

    if (this.formulario().invalid()) {
      this.formulario.email().markAsTouched();
      this.formulario.password().markAsTouched();
      return;
    }

    this.aviso.set(null);

    this.auth.login(this.modelo()).subscribe({
      next: (token) => {
        localStorage.setItem('jwt', JSON.stringify(token));

        this.auth.guardarDatosUsuario().subscribe({
          next: (user) => {
            this.alerta.mostrarInfo(
              'Puedes usar el sistema',
              'Sesion iniciada'
            );
            const usuario = { id: user.id, username: user.username, email: user.email, role: user.role }
            console.log('Usuario:', usuario);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('No se pudo obtener el usuario:', error);

            localStorage.removeItem('jwt');
            localStorage.removeItem('usuario');

            this.aviso.set({
              tipo: 'error',
              texto: 'No se pudo cargar tu perfil. Intentá iniciar sesión nuevamente.'
            });
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.aviso.set(this.interpretarError(err));
        console.error('Error:', err);
      }
    });
  }

  private interpretarError(
    error: HttpErrorResponse
  ): { tipo: 'info' | 'error'; texto: string } {
    if (error.status === 0) {
      return {
        tipo: 'error',
        texto: 'No se pudo conectar con el servidor. Verificá que esté disponible.'
      };
    }

    if (error.status === 401) {
      return {
        tipo: 'error',
        texto: 'Email o contraseña incorrectos.'
      };
    }

    const mensaje = this.extraerMensaje(error.error);

    if (mensaje) {
      return {
        tipo: error.status === 403 ? 'info' : 'error',
        texto: mensaje
      };
    }

    return {
      tipo: 'error',
      texto: 'No se pudo iniciar sesión. Intentá nuevamente.'
    };
  }

  private extraerMensaje(cuerpo: unknown): string | null {
    if (typeof cuerpo === 'string') {
      const texto = cuerpo.trim();

      if (!texto) return null;

      if (texto.startsWith('{')) {
        try {
          return this.extraerMensaje(JSON.parse(texto) as unknown);
        } catch {
          return null;
        }
      }

      return texto;
    }

    if (cuerpo && typeof cuerpo === 'object') {
      const mensaje = Reflect.get(cuerpo, 'message');

      if (typeof mensaje === 'string' && mensaje.trim()) {
        return mensaje.trim();
      }
    }

    return null;
  }
}
