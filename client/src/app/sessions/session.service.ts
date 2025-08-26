import { Injectable, signal, WritableSignal, computed, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface UserStub {
  id: string;
  username: string;
}

export interface Participant extends UserStub {
  instrument: string;
}

export interface JamSession {
  id: string;
  name: string;
  description: string;
  created_by: UserStub['id'];
  created_at: Date;
  song_title?: string;
  song_artist?: string;
  participants: Participant[];
  max_participants: number;
  genre: string;
}

import { environment } from 'src/environments/environment';

const API_URL = `${environment.apiUrl}/api/sessions`;

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private http = inject(HttpClient);

  private _sessions: WritableSignal<JamSession[]> = signal([]);
  private _currentSession: WritableSignal<JamSession | null> = signal(null);

  public readonly sessions: Signal<JamSession[]> = computed(this._sessions);
  public readonly currentSession: Signal<JamSession | null> = computed(this._currentSession);

  constructor() {}

  getSessions(): Observable<JamSession[]> {
    return this.http.get<JamSession[]>(`${API_URL}/list`).pipe(
      tap(sessions => {
        this._sessions.set(sessions);
      }),
      catchError(() => {
        this._sessions.set([]);
        return of([]);
      })
    );
  }

  getSessionById(id: string): Observable<JamSession | null> {
    return this.http.get<JamSession>(`${API_URL}/${id}`).pipe(
      tap(session => {
        this._currentSession.set(session);
      }),
      catchError(() => {
        this._currentSession.set(null);
        return of(null);
      })
    );
  }

  createSession(sessionData: Partial<JamSession>): Observable<JamSession> {
    return this.http.post<JamSession>(`${API_URL}/create`, sessionData);
  }

  addSession(newSession: JamSession): void {
    if (!this._sessions().find(s => s.id === newSession.id)) {
      this._sessions.update(sessions => [newSession, ...sessions]);
    }
  }

  clearState(): void {
    this._sessions.set([]);
    this._currentSession.set(null);
  }
}
