import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { Registro } from './registro';
import { Auth } from '../../services/Auth/auth';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { provideRouter } from '@angular/router';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;
  const authMock = {
    register: vi.fn(() => of({})),
  };
  const usuarioServiceMock = {
    specialities: {
      isLoading: () => false,
      error: () => null,
      value: () => [],
    },
  };
  const alertaMock = {
    mostrarInfo: vi.fn(),
    mostrarError: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: AlertaService, useValue: alertaMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
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
    expect(toggle.querySelector('img')?.getAttribute('src')).toBe('/images/eye-off.svg');
    expect(submit).not.toHaveBeenCalled();
  });

  it('selects a doctor without submitting and displays the license error on submit', () => {
    const enviar = vi.spyOn(component, 'enviar');
    const doctorButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button[type="button"]')[1];

    doctorButton.click();
    fixture.detectChanges();

    expect(enviar).not.toHaveBeenCalled();
    expect(component.modelo().role).toBe('ROLE_DOCTOR');

    component.enviar(new Event('submit'));
    fixture.detectChanges();

    const licenseLabel = Array.from(
      fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>,
    ).find((label) => label.textContent?.includes('Matricula'));

    expect(licenseLabel?.textContent).toContain('La matricula es obligatoria');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it('shows a validation error and does not submit a future birth date', () => {
    component.modelo.update((datos) => ({
      ...datos,
      role: 'ROLE_PATIENT',
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@example.com',
      password: 'password-seguro',
      birthDate: '2999-01-01',
      phoneNumber: '12345678',
    }));

    component.enviar(new Event('submit'));
    fixture.detectChanges();

    expect(component.formulario.birthDate().invalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('La fecha de nacimiento debe ser anterior a hoy');
  });

  it('shows only the message from a JSON-string server error', () => {
    authMock.register.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 500,
      error: JSON.stringify({
        status: 500,
        error: 'Internal Server Error',
        message: 'No se pudo guardar el registro',
      }),
    })));
    component.modelo.update((datos) => ({
      ...datos,
      role: 'ROLE_PATIENT',
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@example.com',
      password: 'password-seguro',
      birthDate: '2000-01-01',
      phoneNumber: '12345678',
    }));

    component.enviar(new Event('submit'));
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorElement.textContent).toContain('No se pudo guardar el registro');
    expect(errorElement.textContent).not.toContain('"status"');
  });
});
