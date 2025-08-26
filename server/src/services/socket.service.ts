
import { Server, Socket } from 'socket.io';
import { findSessionById, addParticipant, removeParticipant, updateSessionSong } from './session.service';
import { User } from '../models/user.model';

// Define interfaces for type safety
interface JoinSessionPayload {
  sessionId: string;
  user: User;
}

interface SongChangedPayload {
  sessionId: string;
  song_title: string;
  song_artist: string;
}

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('joinSession', async ({ sessionId, user }: JoinSessionPayload) => {
      try {
        socket.join(sessionId);
        console.log(`${user.username} (${socket.id}) joined room ${sessionId}`);

        // Add participant to the session in the database
        const updatedSession = await addParticipant(sessionId, user);
        
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
        console.error(`Error in joinSession for session ${sessionId}:`, error);
        socket.emit('error', { message: 'Failed to join session.' });
      }
    });

    socket.on('leaveSession', async ({ sessionId, user }: JoinSessionPayload) => {
      try {
        socket.leave(sessionId);
        console.log(`${user.username} (${socket.id}) left room ${sessionId}`);

        // Remove participant from the session in the database
        await removeParticipant(sessionId, user.id);
        console.log(`Participant ${user.username} removed from DB for session ${sessionId}`);

        // Notify others in the room
        io.to(sessionId).emit('participantLeft', user);
        console.log(`Emitted 'participantLeft' for user ${user.username} to room ${sessionId}`);
      } catch (error) {
        console.error(`Error in leaveSession for session ${sessionId}:`, error);
      }
    });

    socket.on('disconnecting', async () => {
        // The socket is not yet disconnected, so we can still access its rooms.
        for (const room of socket.rooms) {
            if (room !== socket.id) { // every socket is in its own room by default
                // Here we'd need the user ID to remove them. This requires associating a user with a socket.
                // For now, we'll just log it. A more robust solution would store this association.
                console.log(`Socket ${socket.id} is disconnecting from room ${room}`);
            }
        }
    });

    socket.on('disconnect', () => {
      
    });
  });
};
