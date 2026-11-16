import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth-interceptor';
import { Auth } from '../services/Auth/auth';
import { AlertaService } from '../../Common/alerta/alerta-service';
import { TokenResponse } from '../models/token-response';

describe('authInterceptor', () => {
  const auth = {
    refreshToken: vi.fn(),
    getTokens: vi.fn(),
    isAccessTokenExpiring: vi.fn(),
    clearSession: vi.fn(() => {
      localStorage.removeItem('jwt');
      localStorage.removeItem('usuario');
    })
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const alerta = { mostrarError: vi.fn(), mostrarInfo: vi.fn() };
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  const storedTokens = {
    AccessToken: 'expired-access-token',
    RefreshToken: 'valid-refresh-token'
  };

  beforeEach(() => {
    localStorage.clear();
    auth.refreshToken.mockReset();
    auth.getTokens.mockReset();
    auth.isAccessTokenExpiring.mockReset();
    auth.clearSession.mockClear();
    router.navigate.mockClear();
    alerta.mostrarError.mockReset();
    alerta.mostrarInfo.mockReset();

    auth.getTokens.mockReturnValue(null);
    auth.isAccessTokenExpiring.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
        { provide: AlertaService, useValue: alerta }
      ]
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('renews an expired access token and retries the request', () => {
    auth.getTokens.mockReturnValue(storedTokens);
    auth.refreshToken.mockReturnValue(of({
      AccessToken: 'new-access-token',
      RefreshToken: 'new-refresh-token'
    }));
    const next = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
      .mockReturnValueOnce(of(new HttpResponse({ status: 200 })));
    const request = new HttpRequest('GET', 'http://localhost:8080/users/me');

    interceptor(request, next).subscribe();

    expect(auth.refreshToken).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledTimes(2);
    expect(next.mock.calls[0][0].headers.get('Authorization'))
      .toBe('Bearer expired-access-token');
    expect(next.mock.calls[1][0].headers.get('Authorization'))
      .toBe('Bearer new-access-token');
    expect(alerta.mostrarError).not.toHaveBeenCalled();
  });

  it('renews proactively when the access token is about to expire', () => {
    auth.getTokens.mockReturnValue(storedTokens);
    auth.isAccessTokenExpiring.mockReturnValue(true);
    auth.refreshToken.mockReturnValue(of({
      AccessToken: 'fresh-access-token',
      RefreshToken: 'fresh-refresh-token'
    }));
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    const request = new HttpRequest('GET', 'http://localhost:8080/users/me');

    interceptor(request, next).subscribe();

    expect(auth.refreshToken).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].headers.get('Authorization'))
      .toBe('Bearer fresh-access-token');
  });

  it('shares a single refresh between concurrent expired requests', () => {
    auth.getTokens.mockReturnValue(storedTokens);
    const refreshSubject = new Subject<TokenResponse>();
    auth.refreshToken.mockReturnValue(refreshSubject.asObservable());
    const next = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
      .mockReturnValue(of(new HttpResponse({ status: 200 })));
    const first = new HttpRequest('GET', 'http://localhost:8080/users/me');
    const second = new HttpRequest('GET', 'http://localhost:8080/patients');

    interceptor(first, next).subscribe();
    interceptor(second, next).subscribe();

    expect(auth.refreshToken).toHaveBeenCalledOnce();

    refreshSubject.next({
      AccessToken: 'new-access-token',
      RefreshToken: 'new-refresh-token'
    });
    refreshSubject.complete();

    expect(next).toHaveBeenCalledTimes(4);
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('shows a session-expired notice when the refresh token is rejected', () => {
    auth.getTokens.mockReturnValue({
      AccessToken: 'expired-access-token',
      RefreshToken: 'expired-refresh-token'
    });
    auth.refreshToken.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );
    const request = new HttpRequest('GET', 'http://localhost:8080/users/me');

    interceptor(request, next).subscribe({ error: () => undefined });

    expect(auth.clearSession).toHaveBeenCalledOnce();
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(alerta.mostrarError).toHaveBeenCalledWith(
      'Tu sesión expiró. Iniciá sesión nuevamente.',
      'Sesión expirada'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not attach or refresh tokens for the login endpoint', () => {
    auth.getTokens.mockReturnValue(storedTokens);
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    const request = new HttpRequest('POST', 'http://localhost:8080/auth/login', {});

    interceptor(request, next).subscribe();

    expect(auth.refreshToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  });
});
