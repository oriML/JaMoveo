
import { Injectable, OnDestroy, signal, WritableSignal, computed, Signal, inject, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { AuthService, User } from '../auth/auth.service';
import { JamSession, Participant } from './session.service';

export interface Message {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
}

import { environment } from 'src/environments/environment';

const SOCKET_URL = environment.socketUrl;

@Injectable({
  providedIn: 'root',
})
export class SessionSocketService implements OnDestroy {
  private authService = inject(AuthService);
  private socket: Socket;

  // Using Subjects to broadcast events as Observables
  private participantJoined = new Subject<Participant>();
  private participantLeft = new Subject<Participant>();
  private sessionEnded = new Subject<{ sessionId: string, message: string }>();
  private songChanged = new Subject<{ sessionId: string, song_title: string, song_artist: string }>();
  private sessionCreated = new Subject<JamSession>();

  // Public observables for components to subscribe to
  public participantJoined$ = this.participantJoined.asObservable();
  public participantLeft$ = this.participantLeft.asObservable();
  public sessionEnded$ = this.sessionEnded.asObservable();
  public songChanged$ = this.songChanged.asObservable();
  public sessionCreated$ = this.sessionCreated.asObservable();

  // State signals
  private _participants: WritableSignal<Participant[]> = signal([]);
  public readonly participants: Signal<Participant[]> = computed(this._participants);

  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });

    this.setupEventListeners();
  }

  setInitialParticipants(participants: Participant[]): void {
    this._participants.set(participants);
  }

  private connect(): void {
    if (this.socket.connected) return;
    this.socket.connect();
  }

  private setupEventListeners(): void {
    this.socket.on('connect', () => {
    });

    this.socket.on('disconnect', (reason) => {
      this._participants.set([]);
    });

    this.socket.on('sessionState', (state: { participants: Participant[] }) => {
      this._participants.set(state.participants || []);
    });

    this.socket.on('participantJoined', (user: Participant) => {
      this._participants.update(currentParticipants => {
        if (!currentParticipants.some(p => p.id === user.id)) {
          return [...currentParticipants, user];
        }
        return currentParticipants;
      });
      this.participantJoined.next(user);
    });

    this.socket.on('participantLeft', (user: Participant) => {
      this._participants.update(currentParticipants => {
        if (!currentParticipants.some(p => p.id === user.id)) {
          return currentParticipants;
        }
        const updated = currentParticipants.filter(p => p.id !== user.id);
        return updated;
      });
      this.participantLeft.next(user);
    });

    this.socket.on('sessionEnded', (data: { sessionId: string, message: string }) => {
      this.sessionEnded.next(data);
    });

    this.socket.on('songChanged', (data: { sessionId: string, song_title: string, song_artist: string }) => {
      this.songChanged.next(data);
    });

    this.socket.on('sessionCreated', (session: JamSession) => {
      this.sessionCreated.next(session);
    });

    this.socket.on('error', (error: any) => {
    });
  }

  joinSession(sessionId: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return;
    }
    this.socket.emit('joinSession', { sessionId, user: currentUser });
  }

  leaveSession(sessionId: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return;
    }
    
    this.socket.emit('leaveSession', { sessionId, user: currentUser });
  }

  private disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

