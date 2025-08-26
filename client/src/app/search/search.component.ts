
import { Component, inject, signal, Output, EventEmitter, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize, debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

import { environment } from 'src/environments/environment';

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
export class SearchComponent implements OnInit {
  private http = inject(HttpClient);

  songSelected = output<Song>();

  public searchQuery = signal('');
  public results = signal<Song[]>([]);
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  private searchInputSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchInputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
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
        return this.http.get<Song[]>(`${environment.apiUrl}/api/search?q=${query}`).pipe(
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

