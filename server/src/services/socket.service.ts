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

        // Add participant to the session in the database
        const updatedSession = await addParticipant(sessionId, user);
        
        // Store user and session ID on the socket for later use (e.g., on disconnect)
        (socket as any).userId = user.id;
        (socket as any).sessionId = sessionId;
        
        if (updatedSession) {
          // Notify others in the room
          socket.to(sessionId).emit('participantJoined', user);
          // Send the current session state to the joining user
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

        // Remove participant from the session in the database
        await removeParticipant(sessionId, user.id);

        // Notify others in the room
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
          // Notify others in the room that this participant has left
          io.to(sessionId).emit('participantLeft', { id: userId });
        } catch (error) {
        }
      }
    });
  });
};