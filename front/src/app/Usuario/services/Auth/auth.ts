
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

  readonly usuario = signal<UsuarioSesion | null>(this.obtenerUsuarioGuardado());

  readonly rol = signal<string>(
    this.normalizarRol(this.usuario()?.role ?? '')
  );

  register(datos: registerRequest) {
    return this.http.post<TokenResponse>(
      `${this.BASE_URL}/register`,
      datos
    );
  }

  login(datos: loginRequest) {
    return this.http.post<TokenResponse>(
      `${this.BASE_URL}/login`,
      datos
    );
  }

  cargarUsuario(): Observable<Usuario> {
    return this.http.get<Usuario>('http://localhost:8080/users/me').pipe(
      tap((user) => {
        const usuario: UsuarioSesion = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: this.normalizarRol(user.role)
        };

        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuario.set(usuario);
        this.rol.set(usuario.role);
      })
    );
  }

  guardarDatosUsuario(): void {
    this.cargarUsuario().subscribe({
      error: (err) => console.error('Error al cargar usuario:', err)
    });
  }

  private obtenerUsuarioGuardado(): UsuarioSesion | null {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? JSON.parse(guardado) as UsuarioSesion : null;
    } catch {
      return null;
    }
  }

  private normalizarRol(role: string): string {
    return (role ?? '').trim().toUpperCase().replace(/^ROLE_/, '');
  }

  isDoctor(): boolean {
    return this.rol() === 'DOCTOR';
  }

  isPatient(): boolean {
    return this.rol() === 'PATIENT';
  }

  isAdmin(): boolean {
    return this.rol() === 'ADMIN';
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

  logout(): void {
    if (this.isAuthenticated()) {
      this.http.post(
        `${this.BASE_URL}/logout`,
        null,
        { responseType: 'text' }
      ).subscribe({
        error: (error) =>
          console.error('No se pudo cerrar la sesión en el servidor', error)
      });
    }

    localStorage.removeItem('jwt');
    localStorage.removeItem('usuario');

    this.usuario.set(null);
    this.rol.set('');

    this.router.navigate(['/home']);
  }

  forgotPassword(mail: string) {
    return this.http.post(
      `${this.BASE_URL}/forgot-password`,
      { email: mail }
    );
  }

  resetPassword(datos: datosPassword) {
    return this.http.post<string>(
      `${this.BASE_URL}/reset-password`,
      datos
    );
  }

  refreshToken() {
    const tokens = JSON.parse(localStorage.getItem('jwt') || '{}');

    return this.http.post<TokenResponse>(
      `${this.BASE_URL}/refresh`,
      { refreshToken: tokens.RefreshToken }
    ).pipe(
      tap((newTokens) => {
        localStorage.setItem('jwt', JSON.stringify(newTokens));
      })
    );
  }
}
