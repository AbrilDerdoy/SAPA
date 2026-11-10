import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Login } from './login';
import { Auth } from '../../services/Auth/auth';
import { AlertaService } from '../../../Common/alerta/alerta-service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const authMock = {
    login: vi.fn(() => of({})),
    guardarDatosUsuario: vi.fn(() => of({})),
  };
  const alertaMock = {
    mostrarInfo: vi.fn(),
    mostrarError: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: AlertaService, useValue: alertaMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles password visibility without submitting the form', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="password"]');
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-toggle-password');
    const submit = vi.spyOn(component, 'enviar');

    expect(input.type).toBe('password');
    toggle.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(toggle.querySelector('img')?.getAttribute('src')).toBe('/images/eye-off.svg');
    expect(submit).not.toHaveBeenCalled();
  });
});
