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

      return throwError(() => error);
    })
  );
};
