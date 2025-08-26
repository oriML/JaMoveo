import { User } from './user.model';

export interface Participant extends User {
  instrument: string;
}

export interface JamSession {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: Date;
  song_title?: string;
  song_artist?: string;
  participants: Participant[];
  max_participants: number;
  genre: string;
}