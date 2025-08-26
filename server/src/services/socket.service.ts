
import { Server, Socket } from 'socket.io';
import { addParticipant, removeParticipant, getAllSessions } from './session.service';
import { User } from '../models/user.model';

interface JoinSessionPayload {
  sessionId: string;
  user: User;
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

    socket.on('disconnect', async () => {
      const userId = (socket as any).userId;
      const sessionId = (socket as any).sessionId;

      if (userId && sessionId) {
        console.log(`User ${userId} disconnected from session ${sessionId}. Removing participant.`);
        try {
          await removeParticipant(sessionId, userId);
          // Notify others in the room that this participant has left
          io.to(sessionId).emit('participantLeft', { id: userId });
        } catch (error) {
          console.error(`Error removing participant ${userId} from session ${sessionId} on disconnect:`, error);
        }
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  io.on('userLoggedOut', async ({ userId }: { userId: string }) => {
    console.log(`Server: Received userLoggedOut event for userId: ${userId}`);
    try {
      const allSessions = await getAllSessions();
      for (const session of allSessions) {
        const participant = session.participants.find(p => p.id === userId);
        if (participant) {
          console.log(`Server: Removing user ${userId} from session ${session.id} due to logout.`);
          await removeParticipant(session.id, userId);
          io.to(session.id).emit('participantLeft', { id: userId, username: participant.username, instrument: participant.instrument }); // Emit user stub
        }
      }
    } catch (error) {
      console.error(`Error handling userLoggedOut for userId ${userId}:`, error);
    }
  });
};
