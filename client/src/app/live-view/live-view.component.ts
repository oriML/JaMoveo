
import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SessionSocketService } from '../sessions/session-socket.service';
import { AuthService, User, Role } from '../auth/auth.service';
import { Subscription, finalize, lastValueFrom, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { QuitComponent } from '../quit/quit.component';
import { SearchComponent, Song } from '../search/search.component';
import { JamSession } from '../sessions/session.service';

import { environment } from 'src/environments/environment';

interface SongLine {
  lyrics: string;
  chords: string;
}

@Component({
  selector: 'app-live-view',
  standalone: true,
  imports: [CommonModule, RouterModule, QuitComponent, SearchComponent, FormsModule],
  templateUrl: './live-view.component.html',
  styleUrls: ['./live-view.component.scss'],
})
export class LiveViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  public socketService = inject(SessionSocketService);
  private authService = inject(AuthService);

  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef;

  public songTitle = signal<string | undefined>(undefined);
  public songArtist = signal<string | undefined>(undefined);
  public songLines = signal<SongLine[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public sessionName = signal<string | undefined>(undefined);

  public isScrolling = signal(false);
  public isAdmin = signal(false);

  public selectedSong: Song | null = null;

  private _sessionId!: string;
  private _subscriptions = new Subscription();
  private _scrollInterval: any;

  get sessionId(){
    return this._sessionId;
  }

  musicians = computed(() => this.socketService.participants().filter(p => !!p.instrument && p.instrument.toLowerCase() !== 'vocals'));
  singers = computed(() => this.socketService.participants().filter(p => !p.instrument || p.instrument.toLowerCase() === 'vocals'));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      if (id) {
        this._sessionId = id;
        this.fetchInitialSessionData(id);
        this.socketService.joinSession(id);
        this.setupSocketListeners();
      } else {
        this.error.set('No session ID provided.');
        this.isLoading.set(false);
      }
    });

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.isAdmin.set(currentUser.role === Role.Admin);
    }
  }

  ngOnDestroy(): void {
    if (this.sessionId) {
      this.socketService.leaveSession(this.sessionId);
    }
    this._subscriptions.unsubscribe();
    this.stopScrolling();
  }

  private fetchInitialSessionData(sessionId: string): void {
    this.isLoading.set(true);
    this.http.get<JamSession>(`${environment.apiUrl}/api/sessions/${sessionId}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (session) => {
          this.socketService.setInitialParticipants(session.participants);
          this.updateSongContent(session.song_title, session.song_artist);
          this.sessionName.set(session.name);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load session data.');
        },
      });
  }

  private setupSocketListeners(): void {
    this._subscriptions.add(
      this.socketService.songChanged$.subscribe(data => {
        if (data.sessionId === this._sessionId) {
          this.selectedSong = data.song_title ? { title: data.song_title, artist: data.song_artist } as Song : null;
          this.updateSongContent(data.song_title, data.song_artist);
        }
      })
    );

    this._subscriptions.add(
      this.socketService.sessionEnded$.subscribe(data => {
        if (data.sessionId === this._sessionId) {
          
          this.router.navigate(['/sessions']);
        }
      })
    );
  }

  private async updateSongContent(title?: string, artist?: string): Promise<void> {
    this.songTitle.set(title);
    this.songArtist.set(artist);
    this.songLines.set([]);
    this.stopScrolling();

    if (title && artist) {
      try {
        const songs = await lastValueFrom(this.http.get<Song[]>(`${environment.apiUrl}/api/search?q=${title}`));
        const content = songs[0]?.lines;
        if (content?.length) {
          this.songLines.set(content);
          this.startScrolling();
        } else {
          this.songLines.set([{ chords: '', lyrics: 'Lyrics/Chords not available for this song.' }]);
        }
      } catch (error) {
        this.songLines.set([]);
      }
    } else {
      this.songLines.set([]);
    }
  }

  startScrolling(): void {
    if (this.isScrolling()) return;
    this.isScrolling.set(true);
    this._scrollInterval = setInterval(() => {
      if (this.lyricsContainer?.nativeElement) {
        const container = this.lyricsContainer.nativeElement;
        if (container.scrollTop + container.clientHeight < container.scrollHeight) {
          container.scrollTop += 1;
        } else {
          this.stopScrolling();
        }
      }
    }, 50);
  }

  stopScrolling(): void {
    if (this._scrollInterval) {
      clearInterval(this._scrollInterval);
      this._scrollInterval = null;
      this.isScrolling.set(false);
    }
  }
  toggleScrolling(): void {
    if (this.isScrolling()) {
      this.stopScrolling();
    } else {
      this.startScrolling();
    }
  }
  selectSong(song: Song): void {
    this.selectedSong = song;
    this.updateSessionSong(song.title, song.artist);
  }

  removeSelectedSong(): void {
    this.selectedSong = null;
    this.updateSessionSong(null, null);
  }

  private updateSessionSong(title: string | null, artist: string | null): void {
    this.http.post(`${environment.apiUrl}/api/sessions/${this._sessionId}/song`, { song_title: title, song_artist: artist })
    .pipe(take(1))  
    .subscribe();
  }

  isCurrentUser(user: User): boolean {
    return this.authService.currentUser()?.id === user.id;
  }
}
