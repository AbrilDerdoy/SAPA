import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { email } from '@angular/forms/signals';
import { Auth } from '../../service/auth';
import { FormError } from '../../../Common/form-error/form-error';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField,FormError],
  templateUrl: './forgot-password.html',
  styleUrl: '../../shared/form.css',
})
export class ForgotPassword {
  readonly modelo = signal<string>('');
  private readonly auth = inject(Auth)
  readonly formulario = form(this.modelo,(mail)=>{
    required(mail,{message:'El email es obligatorio'})
    email(mail,{message:'Debe tener un formato valido'})
  })
  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;
    this.auth.forgotPassword(this.modelo()).subscribe({
      next:()=>{
        alert('Revisa tu bandeja de entrada y reinicia tu contraseña');
      },
      error:(err)=>{
        alert('Ocurrio un error');
        console.error('Error: ', err);
      }
    });
  }
}
