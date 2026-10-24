import { Component, inject, signal } from '@angular/core';
import { Auth } from '../service/auth';
import { Usuario } from '../usuario';
import { form, minLength, required, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-register-paciente',
  imports: [FormField],
  templateUrl: './register-paciente.html',
  styleUrl: './register-paciente.css',
})
export class RegisterPaciente {
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
  })

  enviar(evento:Event){
    evento.preventDefault();
    if(this.formulario().invalid()) return;
    
    this.auth.register(this.modelo());
  }
}
