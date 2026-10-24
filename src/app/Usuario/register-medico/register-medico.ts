import { Component, inject, signal } from '@angular/core';
import { Auth } from '../service/auth';
import { Usuario } from '../usuario';
import { form, minLength, required, min, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-register-medico',
  imports: [FormField],
  templateUrl: './register-medico.html',
  styleUrl: './register-medico.css',
})
export class RegisterMedico {
  private readonly auth = inject(Auth)
  readonly modelo = signal<Usuario>({
    email:'',
    password:'',
    role:'',
    firstName:'',
    lastName:'',
    birthDate:'',
    phoneNumber:'',
    licenseNumber:'',
    specialities:['']
  });
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.email,{message:'El email es obligatorio'}),
    required(ruta.password,{message:'La contraseña es obligatoria'}),
    minLength(ruta.password,8,{message:'La contraseña debe tener al menos 8 caracteres'}),
    required(ruta.firstName,{message:'El nombre es obligatorio'}),
    required(ruta.lastName,{message:'El apellido es obligatorio'}),
    required(ruta.birthDate,{message:'La fecha de nacimiento es obligatoria'})
    required(ruta.licenseNumber,{message:'La matricula es obligatoria'}),
    min(ruta.licenseNumber,1,{message:'La matricula debe ser positiva'})
    required(ruta.specialities,{message:'La especialidad es obligatoria'})
  })

  enviar(evento:Event){
    evento.preventDefault();
    if(this.formulario().invalid()) return;
    
    this.auth.register(this.modelo());
  }
}
