import { supabase } from '../config/supabaseClient';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  lines: {
    lyrics: string;
    chords: string;
  }[]
}

export const searchSongs = async (query: string, onlyLyrics: boolean): Promise<Song[]> => {
  let queryBuilder = supabase
    .from('songs')
    .select('id, title, artist, duration, lines');

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,artist.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return [];
  }
// need optimization on DB to reduce from query
  let result = onlyLyrics ?
    data.map((song) => {
      return {
        ...song,
        lines: song.lines.reduce((p: [], c: { lyrics: string, chords: string }) => ([
          ...p,
          {
            lyrics: c.lyrics,
            chords: ''
          }]), [])
      }
    })
    : data;

  return result as Song[];
};
