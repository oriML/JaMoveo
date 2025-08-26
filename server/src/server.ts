require('dotenv').config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/authMiddleware';
import authRoutes from './api/auth.routes';
import sessionRoutes from './api/session.routes';
import searchRoutes from './api/search.routes';
import liveRoutes from './api/live.routes';
import { initializeSocket } from './services/socket.service';
import path from 'path';

const app = express();
const server = http.createServer(app);

// const corsOptions = {
//     origin: process.env.CORS_ORIGIN || 'http://localhost:4200', // Allow CORS from specified origin or default
//     credentials: true,
// };

// app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Apply authentication middleware to all /api routes except auth
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth')) {
        return next();
    }
    authMiddleware(req, res, next);
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/live', liveRoutes);


const io = new Server(server, {
    // cors: corsOptions
});

app.set('io', io);

initializeSocket(io);

const publicPath = path.join(__dirname, "public", "browser");
app.use(express.static(publicPath));

app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
});