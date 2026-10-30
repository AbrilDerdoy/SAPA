import { Component, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { Auth } from '../../service/auth';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { applyWhen, form, required, validate, FormField, disabled } from '@angular/forms/signals';
import { UserResponse } from '../../DTOs/user-response';
import { FormError } from '../../../Common/form-error/form-error';

export interface datosUsuario{
  firstName:string,
  lastName:string,
  email:string,
  birthDate:Date,
  phoneNumber:number,
}

@Component({
  selector: 'app-profile',
  imports: [RouterLink, FormField, FormError],
  templateUrl: './profile.html',
  styleUrl: '../../shared/form.css',
})
export class Profile{
  readonly auth = inject(Auth);

  profile = this.auth.getMyProfile();

  modificarDatos = signal<boolean>(false);

  readonly modelo = linkedSignal<datosUsuario>(()=>{
    const datos = this.profile.value();

    return datos ?? {firstName:'',lastName:'',email:'',birthDate:new Date(),phoneNumber:0};
  })

  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.firstName,{message:'El nombre es obligatorio'});
    required(ruta.lastName,{message:'El apellido es obligatorio'});
    required(ruta.birthDate,{message:'La fecha de nacimiento es obligatoria'});
    required(ruta.email,{message:'El email es obligatorio'});
    required(ruta.phoneNumber,{message:'El telefono es obligatorio'});
    disabled(ruta,()=>!this.modificarDatos());
    validate(ruta.birthDate, ({value}) =>
      value() >= new Date()
        ? {kind: 'past', message: 'La fecha de nacimiento debe ser anterior a hoy'}
        : undefined
    );
  })

  toggleFormulario():void{
    this.modificarDatos.update(valor => !valor);
  }

  toggleBotonEnviar(){
    if(this.modificarDatos()&&this.modelo()!==this.profile.value()){
      return false;
    } 
    else{
      return true;
    }
  }

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    console.log('Se ejecuto')

    this.auth.modifyData(
      {firstName:this.modelo().firstName,
        lastName:this.modelo().lastName,
        email:this.modelo().email,
        birthDate:this.modelo().birthDate,
        phoneNumber:this.modelo().phoneNumber}).subscribe({
          next:()=>{
            alert('Cambios registrados');
          },
          error:(err)=>{
            alert('Ocurrio un error');
            console.error('Error: ',err);
          }
        });
  }
}
