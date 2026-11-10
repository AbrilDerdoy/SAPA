
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../../models/usuario';
import { registerRequest } from '../../models/registerRequest';
import { loginRequest } from '../../models/loginRequest';
import { TokenResponse } from '../../models/token-response';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface especialidad {
  readonly id: number;
  name: string;
}

export interface datosPassword {
  token: string;
  newPassword: string;
}

interface UsuarioSesion {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly BASE_URL = 'http://localhost:8080/auth';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  register(datos: registerRequest) {
    return this.http.post<TokenResponse>(this.BASE_URL + '/register', datos)
  }
  login(datos: loginRequest) {
    return this.http.post<TokenResponse>(this.BASE_URL + '/login', datos);
  }
  logout() {
    if (this.isAuthenticated()) {
      this.http.post(`${this.BASE_URL}/logout`, null, { responseType: 'text' }).subscribe({
        next: () => { console.log('Sesion cerrada exitosamente'); },
        error: (error) => console.error('No se pudo cerrar la sesión en el servidor', error)
      });
    }

    localStorage.removeItem('jwt');
    localStorage.removeItem('usuario');
    this.router.navigate(['/home']);
  }

  guardarDatosUsuario() {
    return this.http.get<Usuario>("http://localhost:8080/users/me");
  }

  private normalizarRol(role: string): string {
    return (role ?? '').trim().toUpperCase().replace(/^ROLE_/, '');
  }

  isDoctor(): boolean {
    return this.getRole() === 'DOCTOR';
  }

  isPatient(): boolean {
    return this.getRole() === 'PATIENT';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isAuthenticated(): boolean {
    try {
      const token: Partial<TokenResponse> = JSON.parse(
        localStorage.getItem('jwt') ?? '{}'
      );

      return !!token.AccessToken && !!token.RefreshToken;
    } catch {
      return false;
    }
  }

  private getRole(): string {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}')

      if (!usuario || typeof usuario !== 'object') {
        return ''
      }

      const role = Reflect.get(usuario, 'role')
      return typeof role === 'string'
        ? role.trim().toUpperCase().replace(/^ROLE_/, '')
        : ''
    } catch {
      return ''
    }
  }

  resetPassword(datos: datosPassword) {
    return this.http.post<void>(`${this.BASE_URL}/reset-password`, datos);
  }
  forgotPassword(mail:string){
    return this.http.post(this.BASE_URL+'/forgot-password',{email:mail});
  }

  refreshToken() {
    const tokens = JSON.parse(localStorage.getItem('jwt') || '{}');
    const refreshToken = tokens.RefreshToken;

    return this.http.post<TokenResponse>(`${this.BASE_URL}/refresh`, { refreshToken })
      .pipe(tap((newTokens) => {
        localStorage.setItem('jwt', JSON.stringify(newTokens));
      }));
  }
}
