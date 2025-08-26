import { Server, Socket } from 'socket.io';
import { addParticipant, removeParticipant, getAllSessions } from './session.service';
import { User } from '../models/user.model';

interface JoinSessionPayload {
  sessionId: string;
  user: User;
}

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {

    socket.on('joinSession', async ({ sessionId, user }: JoinSessionPayload) => {
      try {
        socket.join(sessionId);

        const updatedSession = await addParticipant(sessionId, user);
        
        (socket as any).userId = user.id;
        (socket as any).sessionId = sessionId;
        
        if (updatedSession) {
          socket.to(sessionId).emit('participantJoined', user);
          socket.emit('sessionState', {
            participants: updatedSession.participants,
            activeSong: { 
              song_title: updatedSession.song_title, 
              song_artist: updatedSession.song_artist 
            }
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join session.' });
      }
    });

    socket.on('leaveSession', async ({ sessionId, user }: JoinSessionPayload) => {
      try {
        socket.leave(sessionId);

        await removeParticipant(sessionId, user.id);

        io.to(sessionId).emit('participantLeft', user);
      } catch (error) {
      }
    });

    socket.on('disconnecting', async () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
            }
        }
    });

    socket.on('disconnect', async () => {
      const userId = (socket as any).userId;
      const sessionId = (socket as any).sessionId;

      if (userId && sessionId) {
        try {
          await removeParticipant(sessionId, userId);
          io.to(sessionId).emit('participantLeft', { id: userId });
        } catch (error) {
        }
      }
    });
  });
};