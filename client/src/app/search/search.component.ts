
import { Component, inject, signal, Output, EventEmitter, OnInit, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize, debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { SongsService } from '../shared/songs.service';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  lines: { chords: string, lyrics: string }[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {

  private songsService = inject(SongsService);

  songSelected = output<Song>();

  public searchQuery = signal('');
  public results = signal<Song[]>([]);
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  private searchInputSubject = new Subject<string>();
  private destroy$ = new Subject<void>;

  ngOnInit(): void {
    this.searchInputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      tap(query => {
        this.isLoading.set(true);
        this.error.set(null);
        this.searchQuery.set(query);
        if (!query.trim()) {
          this.results.set([]);
        }
      }),
      switchMap(query => {
        if (!query.trim()) {
          return of([]);
        }
        return this.songsService.searchSong(query)
          .pipe(
            catchError((err) => {
              this.error.set(err.error?.message || 'An error occurred during search.');
              return of([]);
            })
          );
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(results => {
      this.results.set(results);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  onSearchInputChange(event: any): void {
    const query = event.target.value;
    this.searchInputSubject.next(query);
  }

  selectSong(song: Song): void {
    this.songSelected.emit(song);
    this.searchQuery.set('');
    this.results.set([]);
    this.error.set(null);
  }
}

