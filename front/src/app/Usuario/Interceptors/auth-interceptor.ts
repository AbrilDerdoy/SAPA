import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../services/Auth/auth';
import { AlertaService } from '../../Common/alerta/alerta-service';
import { TokenResponse } from '../models/token-response';

let refreshRequest: Observable<TokenResponse> | null = null;
let sessionExpiredNoticeShown = false;

function withBearerToken<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * El backend responde 403 con error TUTOR_REQUIRED cuando un paciente menor
 * de edad sin tutor intenta usar una función restringida.
 */
function isTutorRequired(error: HttpErrorResponse): boolean {
  const body: unknown = error.error;

  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return !!parsed
        && typeof parsed === 'object'
        && Reflect.get(parsed, 'error') === 'TUTOR_REQUIRED';
    } catch {
      return body.includes('TUTOR_REQUIRED');
    }
  }

  if (body && typeof body === 'object') {
    return Reflect.get(body, 'error') === 'TUTOR_REQUIRED';
  }

  return false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(Auth);
  const alerta = inject(AlertaService);

  const isLoginRequest = req.url.includes('/auth/login');
  const isRefreshRequest = req.url.includes('/auth/refresh');

  // Los endpoints de autenticación no se firman ni se reintentan.
  if (isLoginRequest || isRefreshRequest) {
    return next(req).pipe(
      tap(() => {
        if (isLoginRequest) {
          sessionExpiredNoticeShown = false;
        }
      })
    );
  }

  const sessionExpired = (error: HttpErrorResponse) => {
    if (error.status === 403 && isTutorRequired(error)) {
      auth.markTutorRequired();

      if (!router.url.startsWith('/mi-tutor')) {
        void router.navigate(['/mi-tutor']);
      }

      return throwError(() => error);
    }

    // Solo se cierra la sesión si el backend rechazó explícitamente el refresh.
    if (error.status !== 400 && error.status !== 401) {
      return throwError(() => error);
    }

    auth.clearSession();

    if (!sessionExpiredNoticeShown) {
      sessionExpiredNoticeShown = true;
      alerta.mostrarError(
        'Tu sesión expiró. Iniciá sesión nuevamente.',
        'Sesión expirada'
      );
    }

    void router.navigate(['/login']);
    return throwError(() => error);
  };

  /**
   * Renueva el token y reintenta la petición original con el token nuevo.
   * Si ya hay un refresh en curso, todos los llamadores comparten la misma
   * petición para no rotar el refresh token varias veces en paralelo.
   */
  const retryWithRefreshedToken = () => {
    if (!refreshRequest) {
      refreshRequest = auth.refreshToken().pipe(
        finalize(() => {
          refreshRequest = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return refreshRequest.pipe(
      switchMap((newTokens) => {
        sessionExpiredNoticeShown = false;
        return next(withBearerToken(req, newTokens.AccessToken));
      }),
      catchError(sessionExpired)
    );
  };

  const tokens = auth.getTokens();

  // Sin sesión guardada: la petición sigue su curso (puede ser un endpoint público).
  if (!tokens?.RefreshToken) {
    return next(tokens?.AccessToken ? withBearerToken(req, tokens.AccessToken) : req);
  }

  // Refresh proactivo: renueva antes de que el access token venza, evitando el 401.
  if (!tokens.AccessToken || auth.isAccessTokenExpiring()) {
    return retryWithRefreshedToken();
  }

  return next(withBearerToken(req, tokens.AccessToken)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return retryWithRefreshedToken();
      }

      if (error.status === 403 && isTutorRequired(error)) {
        auth.markTutorRequired();

        if (!router.url.startsWith('/mi-tutor')) {
          void router.navigate(['/mi-tutor']);
        }
      }

      return throwError(() => error);
    })
  );
};
