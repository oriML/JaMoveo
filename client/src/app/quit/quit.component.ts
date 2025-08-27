import { Component, Input, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize, take } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionService } from '../sessions/session.service';

@Component({
  selector: 'app-quit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quit.component.html',
  styleUrls: ['./quit.component.scss'],
})
export class QuitComponent {
  sessionId = input.required<string>();
  isAdmin = input<boolean>(false);

  private sessionService = inject(SessionService);

  public isQuitting = false;
  public error: string | null = null;

  quitSession(): void {
    if (!this.sessionId || !this.isAdmin || this.isQuitting) {
      return;
    }

    this.isQuitting = true;
    this.error = null;
    this.sessionService.endSession(this.sessionId())
      .pipe(
        finalize(() => this.isQuitting = false),
        take(1),
      )
      .subscribe();
  }
}