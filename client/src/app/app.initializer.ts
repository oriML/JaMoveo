import { APP_INITIALIZER, inject } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export function appInitializer(authService: AuthService) {
  return () => new Promise<void>((resolve) => {
    authService.loadMe().pipe(
      tap(() => console.log('User loaded during app initialization.')),
      catchError((error) => {
        
        return of(null);
      })
    ).subscribe(() => resolve());
  });
}

export const provideAppInitializer = {
  provide: APP_INITIALIZER,
  useFactory: appInitializer,
  deps: [AuthService],
  multi: true,
};