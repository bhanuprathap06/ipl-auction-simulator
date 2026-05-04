require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { registerHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

/* ── CORS ORIGINS ───────────────────────────────────────────────── */
// Supports comma-separated list so you can allow both the Render URL
// and localhost during development:  CLIENT_URL=https://foo.onrender.com,http://localhost:5173
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};

/* ── SOCKET.IO ──────────────────────────────────────────────────── */
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

/* ── MIDDLEWARE ─────────────────────────────────────────────────── */
app.use(cors(corsOptions));
app.use(express.json());

/* ── REST ROUTES ─────────────────────────────────────────────────── */
app.use('/api/rooms',   require('./routes/rooms'));
app.use('/api/players', require('./routes/players'));
app.use('/api/teams',   require('./routes/teams'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

/* ── SOCKET.IO HANDLERS ─────────────────────────────────────────── */
io.on('connection', (socket) => {
  console.log(`✅ New connection: ${socket.id}`);
  registerHandlers(io, socket);
});

/* ── MONGODB + SERVER START ─────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ipl_auction';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 IPL Auction Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting without DB (auction will use seed data at runtime)');
    server.listen(PORT, () => {
      console.log(`🚀 Server (no-DB mode) running on http://localhost:${PORT}`);
    });
  });

module.exports = { app, io };
