import { Component, inject, signal } from '@angular/core';
import { Auth } from '../service/auth';
import { Usuario } from '../usuario';
import { form, minLength, required, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-registro',
  imports: [FormField],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly auth = inject(Auth)
  readonly modelo = signal<Usuario>({
    tipoUsuario:null,
    email:'',
    password:'',
    firstName:'',
    lastName:'',
    birthDate:'',
    phoneNumber:''
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

    const datos = this.modelo();

    let registro :Usuario;

    registro = {
        tipoUsuario:null,
        firstName:datos.firstName,
        lastName:datos.lastName,
        email:datos.email,
        password:datos.password,
        phoneNumber:datos.phoneNumber,
        birthDate:datos.birthDate
      }

    if(datos.tipoUsuario==='PACIENTE'){
      registro.tipoUsuario = 'PACIENTE'
    } else if(datos.tipoUsuario==='MEDICO'){
        registro.tipoUsuario = 'MEDICO',
        registro.licenseNumber = datos.licenseNumber,
        registro.specialities = datos.specialities
      }
    this.auth.register(registro).subscribe({
      next: (res) => {
        console.log('Registro exitoso', res);
      },
      error: (err) => {
        alert('Ocurrio un error');
        console.error('Error al registrarse', err);
      }
    });;
  }    
}


