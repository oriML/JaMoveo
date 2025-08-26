
import { Injectable, signal, computed, WritableSignal, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SessionService } from '../sessions/session.service';

export interface User {
  id: string;
  username: string;
  role: Role;
  instrument?: string;
}

export enum Role {
  Admin = 'ADMIN',
  User = 'USER',
}

export interface SignupDto extends Pick<User, 'username' | 'instrument'> {
  password?: string;
}

export interface LoginDto extends Pick<User, 'username'> {
  password?: string;
}

import { environment } from 'src/environments/environment';

const API_URL = `${environment.apiUrl}/api/auth`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser: WritableSignal<User | null> = signal(null);

  public readonly currentUser: Signal<User | null> = computed(this._currentUser);
  public readonly isLoggedIn = computed(() => !!this._currentUser());
  public readonly authToken = signal<string | null>(null);

  constructor(private http: HttpClient, private sessionService: SessionService) {
    this.loadMe().subscribe();
  }

  signup(signupData: SignupDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/signup`, signupData).pipe(
      tap((user) => {
        this._currentUser.set(user);
      })
    );
  }

  adminSignup(signupData: SignupDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/admin/signup`, signupData).pipe(
      tap((user) => {
        this._currentUser.set(user);
      })
    );
  }

  login(loginData: LoginDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/login`, loginData).pipe(
      tap((user) => {
        this._currentUser.set(user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${API_URL}/logout`, {}).pipe(
      tap(() => {
        this._currentUser.set(null);
        this.authToken.set(null);
        this.sessionService.clearState();
      })
    );
  }

  loadMe(): Observable<User | null> {
    return this.http.get<User>(`${API_URL}/me`).pipe(
      tap((user) => {
        this._currentUser.set(user);
      }),
      catchError(() => {
        this._currentUser.set(null);
        return of(null);
      })
    );
  }
}

