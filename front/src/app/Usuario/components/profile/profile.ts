import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../service/auth';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { applyWhen, form, required, validate } from '@angular/forms/signals';
import { UserResponse } from '../../DTOs/user-response';

export interface datosUsuario{
  firstName:string,
  lastName:string,
  email:string,
  birthDate:Date,
  phoneNumber:number,
  licenseNumber:number|null
}

@Component({
  selector: 'app-profile',
  imports: [DatePipe, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly auth = inject(Auth);

  profile = this.auth.getMyProfile();

  mostrarFormulario = signal<boolean>(false);

  readonly modelo = signal<datosUsuario>({firstName:'',lastName:'',email:'',birthDate:new Date(),phoneNumber:0,licenseNumber:null})
  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.firstName,{message:'El nombre es obligatorio'});
    required(ruta.lastName,{message:'El apellido es obligatorio'});
    required(ruta.birthDate,{message:'La fecha de nacimiento es obligatoria'});
    required(ruta.email,{message:'El email es obligatorio'});
    required(ruta.phoneNumber,{message:'El telefono es obligatorio'});
    applyWhen(
      ruta,
      () => this.profile.hasValue() && this.profile.value().role === 'ROLE_DOCTOR',
      (ruta) => {
      required(ruta.licenseNumber, {message: 'La matricula es obligatoria'});
      }
    );  
    validate(ruta.birthDate, ({value}) =>
      value() >= new Date()
        ? {kind: 'past', message: 'La fecha de nacimiento debe ser anterior a hoy'}
        : undefined
    );
  })

  toggleFormulario():void{
    this.mostrarFormulario.update(valor => !valor);
  }

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    this.auth.modifyData(
      {firstName:this.modelo().firstName,
        lastName:this.modelo().lastName,
        email:this.modelo().email,
        birthDate:this.modelo().birthDate,
        phoneNumber:this.modelo().phoneNumber,
        licenseNumber:this.modelo().licenseNumber});
  }
}
