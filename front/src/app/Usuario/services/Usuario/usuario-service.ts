import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Auth, especialidad } from '../Auth/auth';
import { TokenResponse } from '../../models/token-response';
import { PendingDoctorResponse } from '../../models/pending-doctor-response';

export interface datosUsuario{
  firstName:string,
  lastName:string,
  email:string,
  role:string,
  birthDate:Date,
  phoneNumber:number,
  licenseNumber:number|null
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8080';

  readonly specialities = httpResource<especialidad[]>(()=>`${this.BASE_URL}/specialities`)

  pendingDoctors = httpResource<PendingDoctorResponse[]>(()=>`${this.BASE_URL}/admin/pending-doctors`)

  getMyProfile(){
    return httpResource<datosUsuario>(()=>`${this.BASE_URL}/users/me`)
  }
  
  modifyData(datos:Partial<Omit<datosUsuario,'role'>>){
    return this.http.put<TokenResponse>(`${this.BASE_URL}/users/modify`,datos)
  }

  aceptarSolicitud(userId: number) {
    return this.http.put<{ message: string }>(`${this.BASE_URL}/admin/approve-doctor/${userId}`, {});
  }

  rechazarSolicitud(userId: number) {
    return this.http.put<{ message: string }>(`${this.BASE_URL}/admin/reject-doctor/${userId}`, {});
  }
}
