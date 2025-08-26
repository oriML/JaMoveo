import { supabase } from '../config/supabaseClient';
import { JamSession, Participant } from '../models/session.model';
import { Role, User } from '../models/user.model';
import { Server } from 'socket.io';

export const getAllSessions = async (): Promise<JamSession[]> => {
  const { data, error } = await supabase
    .from('jamsessions')
    .select('*, session_participants(user_id, instrument, users(username, role))');

  if (error) {
    throw new Error(error.message);
  }

  return data.map((session: any) => ({
    id: session.id,
    name: session.name,
    description: session.description,
    created_by: session.created_by,
    created_at: new Date(session.created_at),
    song_title: session.song_title,
    song_artist: session.song_artist,
    max_participants: session.max_participants,
    genre: session.genre,
    participants: session.session_participants.map((p: any) => ({
      id: p.user_id,
      username: p.users.username,
      instrument: p.instrument,
      role: p.users.role,
    })),
  }));
};

export const createSession = async (
  sessionData: Omit<JamSession, 'id' | 'created_at' | 'created_by' | 'participants'>,
  createdByUserId: string,
  initialParticipant: Omit<Participant, 'id'> & { id: string; role: Role },
  io: Server
): Promise<JamSession> => {
  const { data, error } = await supabase
    .from('jamsessions')
    .insert({
      ...sessionData,
      created_by: createdByUserId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const newSession = data as JamSession;

  const { error: participantError } = await supabase
    .from('session_participants')
    .insert({
      session_id: newSession.id,
      user_id: initialParticipant.id,
      instrument: initialParticipant.instrument,
    });

  if (participantError) {
    throw new Error(participantError.message);
  }
  
  const sessionWithParticipant = { ...newSession, participants: [initialParticipant] };

  // Broadcast to all clients
  io.emit('sessionCreated', sessionWithParticipant);

  return sessionWithParticipant;
};

export const findSessionById = async (sessionId: string): Promise<JamSession | undefined> => {
  const { data, error } = await supabase
    .from('jamsessions')
    .select('*, session_participants(user_id, instrument, users(username, role))')
    .eq('id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found, which is not an error here
    throw new Error(error.message);
  }

  if (!data) return undefined;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    created_by: data.created_by,
    created_at: new Date(data.created_at),
    song_title: data.song_title,
    song_artist: data.song_artist,
    max_participants: data.max_participants,
    genre: data.genre,
    participants: data.session_participants.map((p: any) => ({
      id: p.user_id,
      username: p.users.username,
      instrument: p.instrument,
      role: p.users.role,
    })),
  };
};

export const addParticipant = async (sessionId: string, user: User, instrument: string = 'vocals'): Promise<JamSession | undefined> => {
    const session = await findSessionById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.participants.length >= session.max_participants) throw new Error('Session is full');
    if (session.participants.find(p => p.id === user.id)) {
        return session; // User is already in the session
    }

    const { error } = await supabase
        .from('session_participants')
        .insert({ session_id: sessionId, user_id: user.id, instrument: user.instrument || instrument });

    if (error) {
        throw new Error(error.message);
    }

    return findSessionById(sessionId);
};

export const removeParticipant = async (sessionId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('session_participants')
        .delete()
        .match({ session_id: sessionId, user_id: userId });

    if (error) {
        throw new Error(error.message);
    }
};


export const updateSessionSong = async (sessionId: string, songTitle: string | null, songArtist: string | null, io: Server): Promise<JamSession | undefined> => {
  const { data, error } = await supabase
    .from('jamsessions')
    .update({ song_title: songTitle, song_artist: songArtist })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const payload = { sessionId, song_title: songTitle, song_artist: songArtist };
  io.to(sessionId).emit('songChanged', payload);
  
  return findSessionById(sessionId);
};

export const endSession = async (sessionId: string, io: Server): Promise<void> => {
    const { error } = await supabase
        .from('jamsessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        throw new Error(error.message);
    }

    const payload = { sessionId, message: 'The session has ended.' };
    io.to(sessionId).emit('sessionEnded', payload);
    
    setTimeout(() => {
        io.socketsLeave(sessionId);
    }, 500);
};

