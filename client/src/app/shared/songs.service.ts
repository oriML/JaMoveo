import { Injectable, signal, WritableSignal, computed, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, take } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Song } from '../search/search.component';

const API_URL = `${environment.apiUrl}/api/search`;

@Injectable({
    providedIn: 'root',
})
export class SongsService {
    private http = inject(HttpClient);


    constructor() { }

    searchSong(query: string): Observable<Song[]> {
        return this.http.get<Song[]>(`${API_URL}?q=${query}`);
    }

}
