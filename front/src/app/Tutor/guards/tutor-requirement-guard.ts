import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../Usuario/services/Auth/auth';

/**
 * Evita que un paciente menor de edad acceda a funciones del sistema,
 * tenga o no un tutor vinculado. El backend aplica la misma regla.
 */
export const tutorRequirementGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.requiresTutor()) {
    return router.createUrlTree(['/mi-tutor']);
  }

  return true;
};
