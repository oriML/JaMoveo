import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from './auth.service';
import { map } from 'rxjs/operators';

export const roleGuard = (allowedRole?: Role): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUser();

    if (currentUser && allowedRole && currentUser.role === allowedRole) {
      return true;
    }

    if (currentUser) {
      if (currentUser.role === Role.Admin) {
        return router.createUrlTree(['/admin/createSession']);
      } else {
        return router.createUrlTree(['/sessions']);
      }
    } else {
      return router.createUrlTree(['/login']);
    }
  };
};