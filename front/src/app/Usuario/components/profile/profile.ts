import { Component, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, required, validate, FormField, disabled } from '@angular/forms/signals';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { Auth } from '../../services/Auth/auth';
import { AlertaService } from '../../../Common/alerta/alerta-service';
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
  styleUrl: './profile.css',
})
export class Profile{
  readonly auth = inject(Auth);
  private readonly userService = inject(UsuarioService);
  private readonly alerta = inject(AlertaService);

  profile = this.userService.getMyProfile();

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

  cancelar(): void {
  const datos = this.profile.value();
  if (datos) {
    this.modelo.set(datos);
  }
  this.modificarDatos.set(false);
}

  toggleBotonEnviar(){
    if(this.modelo()!==this.profile.value()){
      return false;
    } 
    else{
      return true;
    }
  }

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.formulario().invalid())return;

    this.userService.modifyData(
      {firstName:this.modelo().firstName,
        lastName:this.modelo().lastName,
        email:this.modelo().email,
        birthDate:this.modelo().birthDate,
        phoneNumber:this.modelo().phoneNumber}).subscribe({
          next:(tokens)=>{
            localStorage.setItem('jwt',JSON.stringify(tokens));
            this.modificarDatos.set(false);
            this.profile.reload();
            this.alerta.mostrarInfo('Se modificaron tus datos exitosamente','Cambios Registrados');
          },
          error:(err)=>{
            this.alerta.mostrarError('','Ocurrio un error');  
            console.error('Error: ',err);
          }
        });
  }
}
