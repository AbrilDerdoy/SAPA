import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../service/auth';
import { loginRequest } from '../../interfaces/loginRequest';
import { form, minLength, required, FormField, email } from '@angular/forms/signals';
import { FormError } from '../../../Common/form-error/form-error';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormField, FormError, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../../shared/form.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly modelo = signal<loginRequest>({email:'',password:''});
  readonly aviso = signal<{ tipo: 'info' | 'error'; texto: string } | null>(null);
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.email,{message:'El email es obligatorio'});
    email(ruta.email,{message:'Debe ingresar un email valido'});
    required(ruta.password,{message:'La contraseña es obligatoria'});
    minLength(ruta.password,8,{message:'La contraseña debe tener al menos 8 caracteres'});
  });

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    this.aviso.set(null);

    this.auth.login(this.modelo()).subscribe({
      next:(token)=>{
        alert('Sesion Iniciada')
        localStorage.setItem('jwt',JSON.stringify(token));
        this.auth.guardarDatosUsuario()
        this.router.navigate(['/home']);
       },
      error:(err:HttpErrorResponse)=>{
        this.aviso.set(this.interpretarError(err));
        console.error('Error:',err);
      }
    });
  }

  private interpretarError(error: HttpErrorResponse): { tipo: 'info' | 'error'; texto: string } {
    if (error.status === 0) {
      return { tipo: 'error', texto: 'No se pudo conectar con el servidor. Verificá que esté disponible.' };
    }

    if (error.status === 401) {
      return { tipo: 'error', texto: 'Email o contraseña incorrectos.' };
    }

    const mensaje = this.extraerMensaje(error.error);

    if (mensaje) {
      // 403: la cuenta existe pero todavía no fue aprobada (médico PENDING/REJECTED).
      // No es un error de credenciales, por eso se muestra como aviso informativo.
      return { tipo: error.status === 403 ? 'info' : 'error', texto: mensaje };
    }

    return { tipo: 'error', texto: 'No se pudo iniciar sesión. Intentá nuevamente.' };
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

