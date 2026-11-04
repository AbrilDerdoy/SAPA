import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../services/Auth/auth';

let refreshRequest: ReturnType<Auth['refreshToken']> | null = null;
let sessionExpiredNoticeShown = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(Auth);

  const jwtData = localStorage.getItem('jwt');
  let authReq = req;
  const isLoginRequest = req.url.includes('/auth/login');
  const isRefreshRequest = req.url.includes('/auth/refresh');

  if (jwtData) {
    try {
      const tokens = JSON.parse(jwtData);
      const token = tokens.AccessToken;
      if (token) {
        authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Error al parsear el token para la petición saliente", e);
    }
  }

  return next(authReq).pipe(
    tap(() => {
      if (isLoginRequest) {
        sessionExpiredNoticeShown = false;
      }
    }),
    catchError((error) => {
      if (error.status === 401 && jwtData && !isLoginRequest && !isRefreshRequest) {
        if (!refreshRequest) {
          refreshRequest = authService.refreshToken().pipe(
            shareReplay({ bufferSize: 1, refCount: false }),
            finalize(() => {
              refreshRequest = null;
            })
          );
        }

        return refreshRequest.pipe(
          switchMap((newTokens) => {
            sessionExpiredNoticeShown = false;
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newTokens.AccessToken}` }
            });

            return next(retryReq);
          }),
          catchError((refreshError) => {
            if (refreshError.status !== 400 && refreshError.status !== 401) {
              return throwError(() => refreshError);
            }

            localStorage.removeItem('jwt');
            localStorage.removeItem('usuario');
            if (!sessionExpiredNoticeShown) {
              sessionExpiredNoticeShown = true;
              window.alert('Tu sesión expiró. Iniciá sesión nuevamente.');
            }
            void router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
