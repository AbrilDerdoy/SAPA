import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../Usuario/services/Auth/auth';

function getRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
    return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
  } catch {
    return '';
  }
}

const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.includes(getRole())) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const doctorGuard: CanActivateFn = roleGuard(['DOCTOR']);
export const patientGuard: CanActivateFn = roleGuard(['PATIENT']);
export const adminGuard: CanActivateFn = roleGuard(['ADMIN']);