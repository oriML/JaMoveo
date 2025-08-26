import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-quit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quit.component.html',
  styleUrls: ['./quit.component.scss'],
})
export class QuitComponent {
  @Input() sessionId!: string;
  @Input() isAdmin: boolean = false;

  private http = inject(HttpClient);

  public isQuitting = false;
  public error: string | null = null;

  quitSession(): void {
    if (!this.sessionId || !this.isAdmin || this.isQuitting) {
      return;
    }

    this.isQuitting = true;
    this.error = null;

    this.http.post(`${environment.apiUrl}/api/sessions/${this.sessionId}/end`, {})
      .pipe(finalize(() => this.isQuitting = false))
      .subscribe({
        next: () => {},
        error: err => this.error = err.error?.message || 'Failed to end the session.',
      });
  }
}