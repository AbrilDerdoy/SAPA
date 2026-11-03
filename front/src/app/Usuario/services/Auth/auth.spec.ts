import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Auth } from './auth';


describe('Auth', () => {
  let service: Auth;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(Auth);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('recognizes ADMIN and ROLE_ADMIN regardless of casing or whitespace', () => {
    localStorage.setItem('usuario', JSON.stringify({ role: ' role_admin ' }));

    expect(service.isAdmin()).toBe(true);
  });

  it('returns false for malformed or non-admin user data', () => {
    localStorage.setItem('usuario', '{invalid');
    expect(service.isAdmin()).toBe(false);

    localStorage.setItem('usuario', JSON.stringify({ role: 'ROLE_DOCTOR' }));
    expect(service.isAdmin()).toBe(false);
  });

  it('clears the session, calls the logout endpoint, and returns home', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.setItem('jwt', JSON.stringify({ AccessToken: 'access', RefreshToken: 'refresh' }));
    localStorage.setItem('usuario', JSON.stringify({ role: 'ROLE_ADMIN' }));
    localStorage.setItem('other-data', 'keep');

    service.logout();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('other-data')).toBe('keep');
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    request.flush('Sesión cerrada');

    navigateSpy.mockRestore();
  });
});
