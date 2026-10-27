import { Component, inject, signal } from '@angular/core';
import { Auth } from '../service/auth';
import { registerRequest } from '../registerRequest';
import { form, minLength, required, FormField,min, applyWhen } from '@angular/forms/signals';
import { FormError } from '../../Common/form-error/form-error';

@Component({
  selector: 'app-registro',
  imports: [FormField,FormError],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly auth = inject(Auth)
  readonly modelo = signal<registerRequest>({
    role:null,
    email:'',
    password:'',
    firstName:'',
    lastName:'',
    birthDate:'',
    phoneNumber:'',
    licenseNumber:null,
    speciality:null
  });
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.email,{message:'El email es obligatorio'}),
    required(ruta.password,{message:'La contraseña es obligatoria'}),
    minLength(ruta.password,8,{message:'La contraseña debe tener al menos 8 caracteres'}),
    required(ruta.firstName,{message:'El nombre es obligatorio'}),
    required(ruta.lastName,{message:'El apellido es obligatorio'}),
    required(ruta.birthDate,{message:'La fecha de nacimiento es obligatoria'}),
    required(ruta.phoneNumber,{message:'El telefono es obligatorio'}),
    min(ruta.phoneNumber,1,{message:'El telefono debe ser positivo'}),
    applyWhen(ruta,({valueOf})=>
      valueOf(ruta.role)==='MEDICO',
    (ruta)=>{
      required(ruta.licenseNumber,{message:'La matricula es obligatoria'})
      required(ruta.speciality,{message:'La especialidad es obligatoria'})
    })
  })

  especialidades = this.auth.specialities;

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid()) return;

    const datos = this.modelo();

    let registro :registerRequest;

    registro = {
        role:null,
        firstName:datos.firstName,
        lastName:datos.lastName,
        email:datos.email,
        password:datos.password,
        phoneNumber:datos.phoneNumber,
        birthDate:datos.birthDate,
        licenseNumber:null,
        speciality:null
      }

    if(datos.role==='PACIENTE'){
      registro.role = 'PACIENTE'
    } else if(datos.role==='MEDICO'){
        registro.role = 'MEDICO',
        registro.licenseNumber = datos.licenseNumber,
        registro.speciality = datos.speciality
      }
    this.auth.register(registro).subscribe({
      next: (res) => {
        console.log('Registro exitoso', res);
      },
      error: (err) => {
        alert('Ocurrio un error');
        console.error('Error al registrarse', err);
      }
    });
  }
  cambiarPaciente(){
    this.modelo().role = 'PACIENTE';
  }    
  cambiarMedico(){
    this.modelo().role = 'MEDICO';
  }    
}


