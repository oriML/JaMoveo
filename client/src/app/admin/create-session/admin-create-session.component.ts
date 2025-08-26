import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '../../sessions/session.service';
import { FormsModule } from '@angular/forms';
import { SearchComponent, Song } from '../../search/search.component';
import { GENRE_COLORS } from '../../shared/constants/genre-colors.constant';


@Component({
  selector: 'app-admin-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, SearchComponent],
  templateUrl: './admin-create-session.component.html',
  styleUrls: ['./admin-create-session.component.scss'],
})
export class AdminCreateSessionComponent {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  public genres = Array.from(GENRE_COLORS.keys());
  public apiError: string | null = null;
  public isSubmitting = false;

  public selectedSong: Song | null = null;

  createSessionForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', Validators.maxLength(200)],
    genre: [this.genres[0], Validators.required],
    maxParticipants: [8, [Validators.required, Validators.min(2), Validators.max(20)]],
  });

  get name() {
    return this.createSessionForm.get('name');
  }
  get maxParticipants() {
    return this.createSessionForm.get('maxParticipants');
  }

  selectSong(song: Song): void {
    this.selectedSong = song;
  }

  removeSelectedSong(): void {
    this.selectedSong = null;
  }

  onSubmit(): void {
    if (!this.selectedSong) {
      this.apiError = 'Please select a song for the session.';
      return;
    }

    if (this.createSessionForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const sessionData = {
      ...this.createSessionForm.value,
      max_participants: this.createSessionForm.value.maxParticipants,
      song_title: this.selectedSong?.title,
      song_artist: this.selectedSong?.artist,
    };

    this.sessionService
      .createSession(sessionData as any)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (newSession) => {
          this.router.navigate(['/sessions', newSession.id]);
        },
        error: (err) => {
          this.apiError = err.error?.message || 'Could not create the session.';
        },
      });
  }
}
