import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ResetPassword } from './reset-password';
import { Auth } from '../../services/Auth/auth';
import { AlertaService } from '../../../Common/alerta/alerta-service';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  const authMock = {
    resetPassword: vi.fn(() => of(null)),
  };
  const alertaMock = {
    mostrarInfo: vi.fn(),
    mostrarError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: ' reset-token ' }) } } },
        { provide: Auth, useValue: authMock },
        { provide: AlertaService, useValue: alertaMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads the token from the URL and sends it with the new password', () => {
    component.modelo.set({ password: 'password-seguro', repeatedPassword: 'password-seguro' });

    component.enviar(new Event('submit'));

    expect(component.token).toBe('reset-token');
    expect(authMock.resetPassword).toHaveBeenCalledWith({
      token: 'reset-token',
      newPassword: 'password-seguro',
    });
  });

  it('shows the generic success dialog and redirects to login after the no-content response', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.modelo.set({ password: 'password-seguro', repeatedPassword: 'password-seguro' });

    component.enviar(new Event('submit'));

    expect(alertaMock.mostrarInfo).toHaveBeenCalledWith(
      'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con la nueva contraseña.',
      'Contraseña actualizada',
    );
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
