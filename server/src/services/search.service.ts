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

export const searchSongs = async (query: string): Promise<Song[]> => {
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

  return data as Song[];
};
