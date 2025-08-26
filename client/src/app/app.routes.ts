import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { Role } from './auth/auth.service';

export const routes: Routes = [
    {
    path: '',
    redirectTo: '/sessions',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'admin/signup',
    loadComponent: () =>
      import('./admin/signup/admin-signup.component').then((m) => m.AdminSignupComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search.component').then(m => m.SearchComponent),
    canActivate: [authGuard, roleGuard(Role.Admin)]
  },
  {
    path: 'admin/create-session',
    loadComponent: () => import('./admin/create-session/admin-create-session.component').then(m => m.AdminCreateSessionComponent),
    canActivate: [authGuard, roleGuard(Role.Admin)]
  },
  {
    path: 'admin/live-view/:sessionId',
    loadComponent: () => import('./live-view/live-view.component').then(m => m.LiveViewComponent),
    canActivate: [authGuard, roleGuard(Role.Admin)]
  },
  {
    path: 'live/:sessionId',
    loadComponent: () => import('./live-view/live-view.component').then(m => m.LiveViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sessions',
    loadComponent: () => import('./sessions/list/session-list.component').then(m => m.SessionListComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/sessions',
  },
];
