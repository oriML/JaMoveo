import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SessionService, JamSession } from '../session.service';
import { finalize } from 'rxjs';
import { QuitComponent } from '../../quit/quit.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QuitComponent],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss'],
})
export class SessionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);

  public session = signal<JamSession | null>(null);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public isAdmin = signal(false);

  private sessionId!: string;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.sessionId = id;
        this.loadSessionDetails(id);
      } else {
        this.error.set('No session ID provided.');
        this.isLoading.set(false);
      }
    });

    this.isAdmin.set(this.authService.currentUser()?.role === 'ADMIN');
  }

  private loadSessionDetails(sessionId: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.sessionService.getSessionById(sessionId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (session) => {
          if (session) {
            this.session.set(session);
          } else {
            this.error.set('Session not found.');
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load session details.');
        }
      });
  }
}