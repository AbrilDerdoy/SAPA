import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Auth } from '../../service/auth';
import { FormError } from '../../../Common/form-error/form-error';
import { Router, RouterLink } from '@angular/router';

export interface datos{
  token:string,
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
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  readonly token = input<string>('token');
  readonly modelo = signal<datos>({token:'',password:'',repeatedPassword:''});
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

    const token = this.token().trim();

    if(!token){
      window.alert('El enlace no es valido o ha expirado. Por favor, solicita un nuevo enlace de restablecimiento de contraseña.');
      this.router.navigate(['/login']);
      return;
    }

    const datos = {token:this.modelo().token,newPassword:this.modelo().password}

    this.auth.resetPassword(datos).subscribe({
      next:(res)=>{
        alert(JSON.stringify(res));
      },
      error:(err)=>{
        alert('Ocurrio un error');
        console.error("Error: ",err);
      }
    });
  }
}
