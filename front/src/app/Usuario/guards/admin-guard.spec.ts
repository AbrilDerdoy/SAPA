import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { adminGuard } from './admin-guard';
import { Auth } from '../services/Auth/auth';

describe('adminGuard', () => {
  const auth = {
    isAuthenticated: vi.fn(),
    isAdmin: vi.fn()
  };
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  beforeEach(() => {
    auth.isAuthenticated.mockReset();
    auth.isAdmin.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        provideRouter([])
      ]
    });
  });

  it('redirects unauthenticated users to login', () => {
    auth.isAuthenticated.mockReturnValue(false);

    const result = executeGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot);

    expect(result).toBeInstanceOf(UrlTree);
    expect(result instanceof UrlTree ? result.toString() : result).toBe('/login');
    expect(auth.isAdmin).not.toHaveBeenCalled();
  });

  it('allows authenticated administrators', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.isAdmin.mockReturnValue(true);

    expect(executeGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot)).toBe(true);
  });

  it('redirects authenticated non-administrators to home', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.isAdmin.mockReturnValue(false);

    const result = executeGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot);

    expect(result instanceof UrlTree ? result.toString() : result).toBe('/home');
  });
});
