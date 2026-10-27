import { inject, Injectable, signal } from '@angular/core';
import { Usuario } from '../usuario';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  usuario = signal<Usuario|null>(null);

  private readonly BASE_URL = 'http://localhost:8080/api/auth'
  private readonly http = inject(HttpClient)

  register(usuario:Usuario){
    return this.http.post<Usuario>(this.BASE_URL+'/register',usuario)
  }

  isAuthenticated(){
    return this.usuario() === null ? true : false; 
  }

}
