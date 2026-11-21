import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../Usuario/services/Auth/auth';

/**
 * Evita que un paciente menor de edad sin tutor acceda a las funciones del
 * sistema. El backend aplica la misma regla, por lo que esta guarda es solo
 * la parte de experiencia de usuario.
 */
export const tutorRequirementGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.requiresTutor()) {
    return router.createUrlTree(['/mi-tutor']);
  }

  return true;
};
