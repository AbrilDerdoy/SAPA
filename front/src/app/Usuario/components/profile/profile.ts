import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
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

function dateValue(value: Date | string): string {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  return value;
}

@Component({
  selector: 'app-profile',
  imports: [FormField, FormError],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile{
  readonly auth = inject(Auth);
  private readonly userService = inject(UsuarioService);
  private readonly alerta = inject(AlertaService);

  profile = this.userService.getMyProfile();

  modificarDatos = signal<boolean>(false);

  readonly datosOriginales = computed(() => {
    const datos = this.profile.value();
    return datos ? { ...datos } : null;
  });

  readonly esAdmin = computed(() => this.profile.value()?.role === 'ADMIN');

  readonly modelo = linkedSignal<datosUsuario>(()=>{
    const datos = this.profile.value();

    return datos ? { ...datos } : {firstName:'',lastName:'',email:'',birthDate:new Date(),phoneNumber:0};
  })

  readonly formulario = form(this.modelo,(ruta)=>{
    required(ruta.firstName,{message:'El nombre es obligatorio'});
    required(ruta.lastName,{message:'El apellido es obligatorio'});
    required(ruta.birthDate,{message:'La fecha de nacimiento es obligatoria'});
    required(ruta.email,{message:'El email es obligatorio'});
    required(ruta.phoneNumber,{message:'El telefono es obligatorio'});
    disabled(ruta,()=>!this.modificarDatos());
    validate(ruta.birthDate, ({value}) =>
      dateValue(value()) >= dateValue(new Date())
        ? {kind: 'past', message: 'La fecha de nacimiento debe ser anterior a hoy'}
        : undefined
    );
  })

  toggleFormulario():void{
    if (this.modificarDatos()) {
      this.cancelar();
      return;
    }

    this.modificarDatos.set(true);
  }

  cancelar(): void {
    const datos = this.datosOriginales();
    if (datos) {
      this.modelo.set({ ...datos });
    }
    this.modificarDatos.set(false);
  }

  hayCambios(): boolean {
    const original = this.datosOriginales();
    if (!original) return false;

    const actual = this.modelo();
    return actual.firstName !== original.firstName
      || actual.lastName !== original.lastName
      || actual.email !== original.email
      || dateValue(actual.birthDate) !== dateValue(original.birthDate)
      || String(actual.phoneNumber) !== String(original.phoneNumber);
  }

  private marcarCamposComoTocados(): void {
    this.formulario.firstName().markAsTouched();
    this.formulario.lastName().markAsTouched();
    this.formulario.email().markAsTouched();
    this.formulario.birthDate().markAsTouched();
    this.formulario.phoneNumber().markAsTouched();
  }

  enviar(evento:Event):void{
    evento.preventDefault();
    if(this.esAdmin() || !this.modificarDatos() || !this.hayCambios())return;

    if(this.formulario().invalid()){
      this.marcarCamposComoTocados();
      return;
    }

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
            const detalle = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? '');
            this.alerta.mostrarError(detalle,'Ocurrio un error');
            console.error('Error: ',err);
          }
        });
  }
}