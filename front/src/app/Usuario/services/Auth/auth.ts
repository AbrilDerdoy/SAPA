
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Usuario } from '../../models/usuario';
import { registerRequest } from '../../models/registerRequest';
import { loginRequest } from '../../models/loginRequest';
import { TokenResponse } from '../../models/token-response';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';

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

interface JwtPayload {
  exp?: number;
}

const TOKENS_STORAGE_KEY = 'jwt';
const USER_STORAGE_KEY = 'usuario';
/** Se renueva el token un minuto antes de que venza para evitar el primer 401. */
const REFRESH_LEEWAY_MS = 60_000;

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload: unknown = JSON.parse(atob(padded));

    return payload && typeof payload === 'object' ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
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

    this.clearSession();
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
    const tokens = this.getTokens();
    return !!tokens?.AccessToken && !!tokens?.RefreshToken;
  }

  private getRole(): string {
    try {
      const usuario = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? '{}')

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

  /** Tokens guardados en localStorage, o null si no existen / están corruptos. */
  getTokens(): Partial<TokenResponse> | null {
    try {
      const raw = localStorage.getItem(TOKENS_STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);

      return parsed && typeof parsed === 'object'
        ? (parsed as Partial<TokenResponse>)
        : null;
    } catch {
      return null;
    }
  }

  saveTokens(tokens: TokenResponse): void {
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  }

  clearSession(): void {
    localStorage.removeItem(TOKENS_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  /**
   * Indica si el access token ya venció o está por vencer.
   * Si no tiene un `exp` legible se devuelve false y se deja actuar al
   * refresh reactivo (401 del backend).
   */
  isAccessTokenExpiring(leewayMs: number = REFRESH_LEEWAY_MS): boolean {
    const accessToken = this.getTokens()?.AccessToken;

    if (!accessToken) {
      return true;
    }

    const payload = decodeJwtPayload(accessToken);

    if (!payload?.exp) {
      return false;
    }

    return payload.exp * 1000 - leewayMs <= Date.now();
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getTokens()?.RefreshToken;

    if (!refreshToken) {
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'No hay refresh token disponible'
      }));
    }

    return this.http.post<TokenResponse>(`${this.BASE_URL}/refresh`, { refreshToken })
      .pipe(tap((newTokens) => this.saveTokens(newTokens)));
  }

  getAccessToken(): string | null {
    return this.getTokens()?.AccessToken ?? null;
  }
}
