/**
 * Socket.io event handlers for IPL Auction
 * All real-time auction logic is handled here.
 */

const {
  createRoom, getRoom, deleteRoom, joinRoom, rejoinRoom,
  disconnectParticipant, startAuction, placeBid,
  soldPlayer, advanceToNextPlayer, isAuctionComplete,
  pauseAuction, resumeAuction, endAuction,
  getRoomPublicState, getLeaderboard, rooms,
} = require('../services/auctionService');

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

/* ── TIMER MANAGEMENT ─────────────────────────────────────────── */
function startTimer(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.timerInterval) clearInterval(room.timerInterval);
  room.timeLeft = room.timerSeconds;

  room.timerInterval = setInterval(async () => {
    const r = rooms.get(roomCode);
    if (!r || r.status !== 'active') {
      clearInterval(room.timerInterval);
      return;
    }

    r.timeLeft--;
    io.to(roomCode).emit('timer-tick', { timeLeft: r.timeLeft });

    if (r.timeLeft <= 0) {
      clearInterval(r.timerInterval);
      r.timerInterval = null;
      await handleSold(io, roomCode);
    }
  }, 1000);
}

async function handleSold(io, roomCode) {
  const result = soldPlayer(roomCode);
  if (!result) return;

  // Emit sold/unsold
  if (result.bid) {
    io.to(roomCode).emit('player-sold', {
      player: result.player,
      bid: result.bid,
      leaderboard: getLeaderboard(roomCode),
    });
  } else {
    io.to(roomCode).emit('player-unsold', { player: result.player });
  }

  // Update player status in DB (fire-and-forget)
  try {
    const Player = require('../models/Player');
    if (!result.player.isAIGenerated) {
      await Player.findByIdAndUpdate(result.player._id, {
        status: result.bid ? 'sold' : 'unsold',
        soldTo: result.bid?.teamId || null,
        soldPrice: result.bid?.amount || null,
      });
    }
  } catch (_) { /* non-critical */ }

  // Wait 3s, then advance
  setTimeout(() => {
    const r = rooms.get(roomCode);
    if (!r || r.status === 'ended') return;

    if (isAuctionComplete(roomCode)) {
      const { leaderboard } = endAuction(roomCode);
      io.to(roomCode).emit('auction-ended', { leaderboard });
      return;
    }

    const nextPlayer = advanceToNextPlayer(roomCode);
    io.to(roomCode).emit('next-player', {
      player: nextPlayer,
      currentIndex: r.currentIndex,
      playerPoolSize: r.playerPool.length,
      leaderboard: getLeaderboard(roomCode),
    });
    startTimer(io, roomCode);
  }, 3000);
}

/* ── REGISTER SOCKET HANDLERS ─────────────────────────────────── */
function registerHandlers(io, socket) {
  /* ── CREATE ROOM ─────────────────────────────────── */
  socket.on('create-room', ({ userId, username, teamId, teamName, config = {} }) => {
    try {
      const code = nanoid();
      const room = createRoom(code, { socketId: socket.id, userId, username, teamId, teamName }, config);
      socket.join(code);
      socket.emit('room-created', {
        code,
        room: getRoomPublicState(code),
        yourUserId: userId,
      });
      console.log(`🏟️  Room ${code} created by ${username} (${teamId})`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /* ── JOIN ROOM ───────────────────────────────────── */
  socket.on('join-room', ({ code, userId, username, teamId, teamName }) => {
    try {
      const result = joinRoom(code, { socketId: socket.id, userId, username, teamId, teamName });
      if (result.error) return socket.emit('error', { message: result.error });

      socket.join(code);
      socket.emit('room-joined', {
        code,
        room: getRoomPublicState(code),
        yourUserId: userId,
        rejoined: result.rejoined,
      });

      // Notify everyone else
      socket.to(code).emit('participant-joined', {
        username, teamId, teamName,
        room: getRoomPublicState(code),
      });

      console.log(`👤 ${username} (${teamId}) joined room ${code}`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /* ── REJOIN ROOM ─────────────────────────────────── */
  socket.on('rejoin-room', ({ code, userId }) => {
    try {
      const room = rejoinRoom(code, { socketId: socket.id, userId });
      if (!room) return socket.emit('error', { message: 'Room not found or session expired' });

      socket.join(code);
      socket.emit('room-rejoined', { room: getRoomPublicState(code) });
      socket.to(code).emit('participant-reconnected', { userId });
      console.log(`🔄 userId=${userId} rejoined room ${code}`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /* ── GET ROOM STATE ──────────────────────────────── */
  socket.on('get-room-state', ({ code }) => {
    const state = getRoomPublicState(code);
    if (!state) return socket.emit('error', { message: 'Room not found' });
    socket.emit('room-state', { room: state });
  });

  /* ── START AUCTION (host only) ───────────────────── */
  socket.on('start-auction', async ({ code, userId }) => {
    try {
      const room = getRoom(code);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostUserId !== userId) return socket.emit('error', { message: 'Only the host can start the auction' });
      if (room.status !== 'waiting') return socket.emit('error', { message: 'Auction already started' });

      const result = await startAuction(code);
      if (result.error) return socket.emit('error', { message: result.error });

      io.to(code).emit('auction-started', {
        room: getRoomPublicState(code),
        currentPlayer: result.currentPlayer,
        playerPoolSize: result.room.playerPool.length,
      });

      startTimer(io, code);
      console.log(`🔔 Auction started in room ${code}`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /* ── PLACE BID ───────────────────────────────────── */
  socket.on('place-bid', ({ code, userId, teamId, teamName, username, amount }) => {
    try {
      const result = placeBid(code, { socketId: socket.id, userId, teamId, teamName, username, amount });
      if (result.error) return socket.emit('bid-error', { message: result.error });

      io.to(code).emit('bid-placed', {
        bid: result.bid,
        bidEntry: result.bidEntry,
        timeLeft: getRoom(code)?.timeLeft,
      });
    } catch (err) {
      socket.emit('bid-error', { message: err.message });
    }
  });

  /* ── ADMIN: PAUSE ────────────────────────────────── */
  socket.on('pause-auction', ({ code, userId }) => {
    const room = getRoom(code);
    if (!room || room.hostUserId !== userId) return socket.emit('error', { message: 'Unauthorized' });
    pauseAuction(code);
    io.to(code).emit('auction-paused', { message: 'Auction paused by host' });
  });

  /* ── ADMIN: RESUME ───────────────────────────────── */
  socket.on('resume-auction', ({ code, userId }) => {
    const room = getRoom(code);
    if (!room || room.hostUserId !== userId) return socket.emit('error', { message: 'Unauthorized' });
    resumeAuction(code);
    io.to(code).emit('auction-resumed', { message: 'Auction resumed' });
    startTimer(io, code);
  });

  /* ── ADMIN: SKIP PLAYER ──────────────────────────── */
  socket.on('skip-player', async ({ code, userId }) => {
    const room = getRoom(code);
    if (!room || room.hostUserId !== userId) return socket.emit('error', { message: 'Unauthorized' });
    if (room.timerInterval) clearInterval(room.timerInterval);
    await handleSold(io, code);
  });

  /* ── ADMIN: OVERRIDE BID ─────────────────────────── */
  socket.on('override-bid', ({ code, userId, teamId, teamName, amount }) => {
    const room = getRoom(code);
    if (!room || room.hostUserId !== userId) return socket.emit('error', { message: 'Unauthorized' });
    if (!room.currentBid) return socket.emit('error', { message: 'No active bid' });

    room.currentBid = { amount, teamId, teamName, username: 'HOST OVERRIDE', timestamp: Date.now() };
    io.to(code).emit('bid-placed', { bid: room.currentBid, bidEntry: null, timeLeft: room.timeLeft });
  });

  /* ── ADMIN: END AUCTION ──────────────────────────── */
  socket.on('end-auction', ({ code, userId }) => {
    const room = getRoom(code);
    if (!room || room.hostUserId !== userId) return socket.emit('error', { message: 'Unauthorized' });
    const { leaderboard } = endAuction(code);
    io.to(code).emit('auction-ended', { leaderboard });
  });

  /* ── GET LEADERBOARD ─────────────────────────────── */
  socket.on('get-leaderboard', ({ code }) => {
    socket.emit('leaderboard', { leaderboard: getLeaderboard(code) });
  });

  /* ── DISCONNECT ──────────────────────────────────── */
  socket.on('disconnecting', () => {
    for (const roomCode of socket.rooms) {
      if (roomCode === socket.id) continue;
      disconnectParticipant(roomCode, socket.id);
      socket.to(roomCode).emit('participant-disconnected', { socketId: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log(`⚠️  Socket ${socket.id} disconnected`);
  });
}

module.exports = { registerHandlers };
