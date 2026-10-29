import { Component, inject, signal } from '@angular/core';
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
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.email,{message:'El email es obligatorio'});
    email(ruta.email,{message:'Debe ingresar un email valido'});
    required(ruta.password,{message:'La contraseña es obligatoria'});
    minLength(ruta.password,8,{message:'La contraseña debe tener al menos 8 caracteres'});
  });

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    this.auth.login(this.modelo()).subscribe({
      next:(token)=>{
        alert('Sesion Iniciada')
        localStorage.setItem('jwt',JSON.stringify(token));
        this.auth.guardarDatosUsuario()
        this.router.navigate(['/home']);
       },
      error:(err)=>{
        alert('Ocurrio un error');
        console.error('Error:',err);
      }
    });
  }

}

