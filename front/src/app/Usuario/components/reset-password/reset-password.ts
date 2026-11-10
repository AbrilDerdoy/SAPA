import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Auth } from '../../services/Auth/auth';
import { FormError } from '../../../Common/form-error/form-error';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertaService } from '../../../Common/alerta/alerta-service';

export interface datos{
  password:string,
  repeatedPassword:string
}


@Component({
  selector: 'app-reset-password',
  imports: [FormField,FormError,RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../../shared/form.css',
})
export class ResetPassword {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly alerta = inject(AlertaService);
  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  readonly modelo = signal<datos>({password:'',repeatedPassword:''});
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.password,{message:'La contraseña nueva es obligatoria'});
    required(ruta.repeatedPassword,{message:'Es necesario repetir la contraseña'});
    minLength(ruta.password,8,{message:'La contraseña debe tener al menos 8 caracteres'});
    minLength(ruta.repeatedPassword,8,{message:'La contraseña debe tener al menos 8 caracteres'});
    validate(ruta.repeatedPassword, ({ value, valueOf }) => {
      const pass = valueOf(ruta.password);
      const repeatedPass = value();

      if (pass !== repeatedPass) {
        return {
          kind: 'passwordMismatch',
          message: 'Las contraseñas no coinciden'
        };
      }
      return null;
    });
  });

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    if(!this.token){
      this.alerta.mostrarInfo('El enlace no es valido o ha expirado. Por favor, solicita un nuevo enlace de restablecimiento de contraseña','Enlace Invalido')
      this.router.navigate(['/login']);
      return;
    }

    const datos = {token:this.token,newPassword:this.modelo().password}

    this.auth.resetPassword(datos).subscribe({
      next:()=>{
        this.alerta.mostrarInfo(
          'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con la nueva contraseña.',
          'Contraseña actualizada'
        );
        this.router.navigate(['/login']);
      },
      error:(error: HttpErrorResponse)=>{
        const detalle = this.extraerMensaje(error.error);
        const mensaje = detalle
          ?? (error.status === 0
            ? 'No se pudo conectar con el servidor. Inténtalo nuevamente.'
            : `No se pudo actualizar la contraseña (HTTP ${error.status}). Verifica que el enlace siga vigente.`);
        this.alerta.mostrarError(mensaje,'No se pudo actualizar la contraseña');
        console.error('Error al restablecer la contraseña:',error);
      }
    });
  }

  private extraerMensaje(cuerpo: unknown): string | null {
    if (typeof cuerpo === 'string' && cuerpo.trim()) {
      return cuerpo.trim();
    }

    if (cuerpo && typeof cuerpo === 'object') {
      for (const campo of ['message', 'detail', 'title']) {
        const mensaje = Reflect.get(cuerpo, campo);
        if (typeof mensaje === 'string' && mensaje.trim()) {
          return mensaje.trim();
        }
      }
    }

    return null;
  }
}
