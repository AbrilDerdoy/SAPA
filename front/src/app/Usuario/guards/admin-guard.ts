import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/Auth/auth';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
