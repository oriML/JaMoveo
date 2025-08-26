import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService, JamSession } from '../session.service';
import { FormsModule } from '@angular/forms';
import { AuthService, Role } from 'src/app/auth/auth.service';
import { SessionSocketService } from '../session-socket.service';
import { Subscription } from 'rxjs';
import { GENRE_COLORS } from '../../shared/constants/genre-colors.constant';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
})
export class SessionListComponent implements OnInit, OnDestroy {
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private socketService = inject(SessionSocketService);
  private subscription = new Subscription();

  public sessions = this.sessionService.sessions;
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public currentUser = this.authService.currentUser;

  get isAdmin(){
    return this.authService.currentUser()?.role === Role.Admin;
  }

  getGenreStyle(genre: string) {
    return GENRE_COLORS.get(genre.toUpperCase());
  }

  ngOnInit(): void {
    this.loadSessions();

    this.subscription.add(
      this.socketService.sessionCreated$.subscribe(newSession => {
        this.sessionService.addSession(newSession);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.sessionService.getSessions().subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load sessions.');
        this.isLoading.set(false);
      },
    });
  }

  viewSessionDetails(sessionId: string): void {
    // Navigation logic remains the same
    this.router.navigate(['/live', sessionId]);
  }
}
