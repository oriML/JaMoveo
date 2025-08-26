import { Injectable, signal, computed, WritableSignal, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SessionService } from '../sessions/session.service';

export interface User {
  id: string;
  username: string;
  role: Role;
  instrument?: string;
  token?: string; // Add token property
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
import { SessionSocketService } from '../sessions/session-socket.service';

const API_URL = `${environment.apiUrl}/api/auth`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser: WritableSignal<User | null> = signal(null);

  public readonly currentUser: Signal<User | null> = computed(this._currentUser);
  public readonly isLoggedIn = computed(() => !!this._currentUser());
  public readonly authToken = signal<string | null>(null);

  private _logoutSubject = new Subject<void>();
  public logout$ = this._logoutSubject.asObservable();

  constructor(private http: HttpClient, private sessionService: SessionService) {
  }

  private _handleAuthSuccess(user: User): void {
    this._currentUser.set(user);
    if (user.token) {
      localStorage.setItem('jwt_token', user.token);
      this.authToken.set(user.token);
    }
  }

  signup(signupData: SignupDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/signup`, signupData).pipe(
      tap((user) => this._handleAuthSuccess(user))
    );
  }

  adminSignup(signupData: SignupDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/admin/signup`, signupData).pipe(
      tap((user) => this._handleAuthSuccess(user))
    );
  }

  login(loginData: LoginDto): Observable<User> {
    return this.http.post<User>(`${API_URL}/login`, loginData).pipe(
      tap((user) => this._handleAuthSuccess(user))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${API_URL}/logout`, {}).pipe(
      tap(() => {
        this._currentUser.set(null);
        localStorage.removeItem('jwt_token');
        this.authToken.set(null);
        this.sessionService.clearState();
        this._logoutSubject.next(); // Emit logout event
      })
    );
  }

  loadMe(): Observable<User | null> {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.authToken.set(token);
      // Make the /me request with the token from localStorage
      return this.http.get<User>(`${API_URL}/me`).pipe(
        tap((user) => {
          this._currentUser.set(user);
        }),
        catchError((err) => {
          this._currentUser.set(null);
          localStorage.removeItem('jwt_token'); // Clear invalid token
          this.authToken.set(null);
          return of(null);
        })
      );
    } else {
      this._currentUser.set(null);
      return of(null);
    }
  }
}