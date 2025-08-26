import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CanActivateFn, UrlTree, Router } from '@angular/router';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};