import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Usuario } from '../interfaces/usuario';
import { registerRequest } from '../interfaces/registerRequest';
import { loginRequest } from '../interfaces/loginRequest';
import { TokenResponse } from '../interfaces/token-response';

export interface especialidad{
  readonly id:number,
  name:string
}

export interface datosPassword{
  token:string,
  newPassword:string
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly BASE_URL = 'http://localhost:8080/auth'
  private readonly http = inject(HttpClient)

  register(datos:registerRequest){
    return this.http.post<TokenResponse>(this.BASE_URL+'/register',datos)
  }
  login(datos:loginRequest){
    return this.http.post<TokenResponse>(this.BASE_URL+'/login',datos);
  }
  logout(){
    if(this.isAuthenticated()){
      const jwt = localStorage.getItem('jwt');
      this.http.post(this.BASE_URL+"/logout",jwt);
      localStorage.clear();
      console.clear();
      alert('Sesion cerrada')
    } else {
      console.error('No hay token de autenticacion')
    }
  }
  guardarDatosUsuario(){
    this.http.get<Usuario>("http://localhost:8080/users/me").subscribe({
      next:(user)=>{
        const usuario = {id:user.id,username:user.username,email:user.email,role:user.role}
        console.log('Usuario:',usuario);
        localStorage.setItem('usuario',JSON.stringify(usuario));
      },
      error: (err)=>{
        console.error('Error:',err);
      }
    })
  }

  isAuthenticated(){
    const token:TokenResponse = JSON.parse(localStorage.getItem('jwt')??'{"AccessToken":"","RefreshToken":""}');
    return token.AccessToken === "" || token.RefreshToken === "" ? false : true; 
  }

  forgotPassword(mail:string){
    return this.http.post(this.BASE_URL+'/forgot-password',{email:mail});
  }
  resetPassword(datos:datosPassword){
    return this.http.post<string>(this.BASE_URL+'/reset-password',datos);
  }

  readonly specialities = httpResource<especialidad[]>(()=>'http://localhost:8080/specialities')

}
