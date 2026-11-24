import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../Usuario/services/Auth/auth';
import { inject } from '@angular/core';

function getRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
    return String(usuario.role ?? '').toUpperCase().replace('ROLE_', '');
  } catch {
    return '';
  }
}

export const roleGuard = (allowedRoles: string[]): CanActivateFn => (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.includes(getRole())) {
    // Un paciente menor solo puede gestionar su tutela.
    if (auth.requiresTutor() && !state.url.startsWith('/mi-tutor')) {
      return router.createUrlTree(['/mi-tutor']);
    }

    return true;
  }

  return router.createUrlTree(['/']);
};