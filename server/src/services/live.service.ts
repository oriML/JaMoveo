import { findSessionById } from './session.service';
import { Participant } from '../models/session.model';

interface LiveSessionData {
  singers: Participant[];
  musicians: Participant[];
  song_title?: string;
  song_artist?: string;
}

export const getLiveSessionData = async (sessionId: string): Promise<LiveSessionData | null> => {
  const session = await findSessionById(sessionId);

  if (!session) {
    return null;
  }

  const singers: Participant[] = [];
  const musicians: Participant[] = [];

  session.participants.forEach(participant => {
    if (participant.instrument.toLowerCase() === 'vocals') {
      singers.push(participant);
    } else {
      musicians.push(participant);
    }
  });

  return { 
    singers, 
    musicians, 
    song_title: session.song_title,
    song_artist: session.song_artist
  };
};