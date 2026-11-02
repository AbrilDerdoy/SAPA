import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth-interceptor';
import { Auth } from '../service/auth';

describe('authInterceptor', () => {
  const auth = { refreshToken: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    localStorage.clear();
    auth.refreshToken.mockReset();
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('renews an expired access token and retries the request', () => {
    localStorage.setItem('jwt', JSON.stringify({
      AccessToken: 'expired-access-token',
      RefreshToken: 'valid-refresh-token'
    }));
    auth.refreshToken.mockReturnValue(of({
      AccessToken: 'new-access-token',
      RefreshToken: 'new-refresh-token'
    }));
    const next = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
      .mockReturnValueOnce(of(new HttpResponse({ status: 200 })));
    const request = new HttpRequest('GET', 'http://localhost:8080/users/me');
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    interceptor(request, next).subscribe();

    expect(auth.refreshToken).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledTimes(2);
    expect(JSON.parse(localStorage.getItem('jwt') ?? '{}').AccessToken).toBe('new-access-token');
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('shows a session-expired notice when the refresh token is rejected', () => {
    localStorage.setItem('jwt', JSON.stringify({
      AccessToken: 'expired-access-token',
      RefreshToken: 'expired-refresh-token'
    }));
    auth.refreshToken.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );
    const request = new HttpRequest('GET', 'http://localhost:8080/users/me');
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    interceptor(request, next).subscribe({ error: () => undefined });

    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(alert).toHaveBeenCalledWith(
      'Tu sesión se cerró porque el token expiró o es inválido. Iniciá sesión nuevamente.'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    alert.mockRestore();
  });
});
