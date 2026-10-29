import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Usuario } from '../usuario';
import { registerRequest } from '../registerRequest';
import { loginRequest } from '../loginRequest';
import { TokenResponse } from '../token-response';

export interface especialidad{
  readonly id:number,
  name:string
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  usuario = signal<Usuario|null>(null);
  datosRegistro = signal<registerRequest|null>(null)

  private readonly BASE_URL = 'http://localhost:8080/auth'
  private readonly http = inject(HttpClient)

  register(datos:registerRequest){
    return this.http.post<registerRequest>(this.BASE_URL+'/register',datos)
  }
  login(datos:loginRequest){
    return this.http.post<TokenResponse>(this.BASE_URL+'/login',datos);
  }

  isAuthenticated(){
    return this.usuario() === null ? false : true; 
  }

  readonly specialities = httpResource<especialidad[]>(()=>'http://localhost:8080/specialities')

}
