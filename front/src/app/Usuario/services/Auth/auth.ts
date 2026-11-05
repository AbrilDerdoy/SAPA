import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Usuario } from '../../models/usuario';
import { registerRequest } from '../../models/registerRequest';
import { loginRequest } from '../../models/loginRequest';
import { TokenResponse } from '../../models/token-response';
import { tap } from 'rxjs';
import { Router } from '@angular/router';

export interface especialidad {
  readonly id: number,
  name: string
}

export interface datosPassword {
  token: string,
  newPassword: string
}



@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly BASE_URL = 'http://localhost:8080/auth'
  private readonly http = inject(HttpClient)
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
    this.http.get<Usuario>("http://localhost:8080/users/me").subscribe({
      next: (user) => {
        const usuario = { id: user.id, username: user.username, email: user.email, role: user.role }
        console.log('Usuario:', usuario);
        localStorage.setItem('usuario', JSON.stringify(usuario));
      },
      error: (err) => {
        console.error('Error:', err);
      }
    })
  }

  isAuthenticated() {
    try {
      const token: Partial<TokenResponse> = JSON.parse(localStorage.getItem('jwt') ?? '{}');
      return !!token.AccessToken && !!token.RefreshToken;
    } catch {
      return false;
    }
  }
  isAdmin() {
    try {
      const usuario: unknown = JSON.parse(localStorage.getItem('usuario') ?? '{}');
      if (!usuario || typeof usuario !== 'object') {
        return false;
      }

      const role: unknown = Reflect.get(usuario, 'role');
      return typeof role === 'string'
        && role.trim().toUpperCase().replace(/^ROLE_/, '') === 'ADMIN';
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

  isDoctor(): boolean {
    return this.getRole() === 'DOCTOR'
  }

  isPatient(): boolean{
    return this.getRole() === 'PATIENT'
  }

  forgotPassword(mail: string) {
    return this.http.post(this.BASE_URL + '/forgot-password', { email: mail });
  }
  resetPassword(datos: datosPassword) {
    return this.http.post<string>(this.BASE_URL + '/reset-password', datos);
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
