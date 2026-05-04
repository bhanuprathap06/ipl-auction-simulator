/**
 * auctionService.js
 * In-memory auction state manager. Each room has isolated state.
 * All auction logic (timer, bids, sold/unsold) runs server-side.
 */

const Player = require('../models/Player');

// In-memory room store: roomCode → roomState
const rooms = new Map();

/* ─── ROOM STATE SCHEMA ───────────────────────────────────────────
 * {
 *   code, hostSocketId, hostUserId, status,
 *   participants: [{ socketId, userId, username, teamId, teamName,
 *                    primaryColor, budget, spent, squad, isHost, isConnected }],
 *   playerPool: [ ...Player docs ],  // shuffled
 *   currentIndex: 0,
 *   currentPlayer: Player | null,
 *   currentBid: { amount, teamId, teamName, username } | null,
 *   timerSeconds: 30,
 *   timerInterval: null,
 *   timeLeft: 30,
 *   bidLog: [],
 *   config: { totalBudget, timerSeconds, minBidIncrement },
 *   lastBidAt: Map<teamId, timestamp>  // anti-spam
 * }
 */

const IPL_TEAM_COLORS = {
  MI:   { primary: '#004BA0', secondary: '#D1AB3E' },
  CSK:  { primary: '#F9CD05', secondary: '#0081E9' },
  RCB:  { primary: '#EC1C24', secondary: '#000000' },
  KKR:  { primary: '#3A225D', secondary: '#B3A123' },
  DC:   { primary: '#0078BC', secondary: '#EF1C25' },
  PBKS: { primary: '#ED1B24', secondary: '#A7A9AC' },
  RR:   { primary: '#254AA5', secondary: '#FF69B4' },
  SRH:  { primary: '#F26522', secondary: '#000000' },
  GT:   { primary: '#1C1C1C', secondary: '#0B4973' },
  LSG:  { primary: '#A72056', secondary: '#FFDB00' },
};

/* ── HELPERS ───────────────────────────────────────────────────── */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateAIPlayer(index) {
  const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
  const names = ['Raj Kumar', 'Amit Singh', 'Pradeep Rao', 'Sanjay Mishra', 'Kiran Verma', 'Dev Chauhan', 'Anil Jha', 'Ravi Nair'];
  const nationalities = ['Indian', 'Indian', 'Indian', 'West Indian', 'Sri Lankan'];
  const role = roles[index % roles.length];
  return {
    _id: `ai_${Date.now()}_${index}`,
    name: names[index % names.length] + ` ${Math.floor(Math.random() * 99) + 1}`,
    role,
    nationality: nationalities[index % nationalities.length],
    isOverseas: index % 5 === 0,
    isCapped: false,
    age: Math.floor(Math.random() * 10) + 19,
    basePrice: 20,
    stats: { matches: 0, runs: 0, wickets: 0, average: 0, strikeRate: 0, economy: 0 },
    isAIGenerated: true,
    status: 'available',
  };
}

/* ── ROOM CRUD ─────────────────────────────────────────────────── */
function createRoom(code, { socketId, userId, username, teamId, teamName }, config = {}) {
  const colors = IPL_TEAM_COLORS[teamId] || { primary: '#1a1a2e', secondary: '#ffffff' };
  const room = {
    code,
    hostSocketId: socketId,
    hostUserId: userId,
    status: 'waiting',
    participants: [{
      socketId, userId, username, teamId, teamName,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      budget: config.totalBudget || 12000,
      spent: 0,
      squad: [],
      isHost: true,
      isConnected: true,
    }],
    playerPool: [],
    currentIndex: 0,
    currentPlayer: null,
    currentBid: null,
    timerSeconds: config.timerSeconds || 30,
    timerInterval: null,
    timeLeft: 0,
    bidLog: [],
    config: {
      totalBudget: config.totalBudget || 12000,  // Lakhs
      timerSeconds: config.timerSeconds || 30,
      minBidIncrement: config.minBidIncrement || 25, // Lakhs
    },
    lastBidAt: new Map(),
    soldCount: 0,
    unsoldCount: 0,
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room?.timerInterval) clearInterval(room.timerInterval);
  rooms.delete(code);
}

function joinRoom(code, { socketId, userId, username, teamId, teamName }) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'waiting') return { error: 'Auction already in progress' };

  // check team not already taken (unless rejoining)
  const existing = room.participants.find(p => p.userId === userId);
  if (existing) {
    existing.socketId = socketId;
    existing.isConnected = true;
    return { room, rejoined: true };
  }

  const teamTaken = room.participants.find(p => p.teamId === teamId);
  if (teamTaken) return { error: `${teamName} is already taken by ${teamTaken.username}` };

  if (room.participants.length >= 10) return { error: 'Room is full (max 10 teams)' };

  const colors = IPL_TEAM_COLORS[teamId] || { primary: '#1a1a2e', secondary: '#ffffff' };
  room.participants.push({
    socketId, userId, username, teamId, teamName,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    budget: room.config.totalBudget,
    spent: 0,
    squad: [],
    isHost: false,
    isConnected: true,
  });
  return { room, rejoined: false };
}

function rejoinRoom(code, { socketId, userId }) {
  const room = rooms.get(code);
  if (!room) return null;
  const p = room.participants.find(p => p.userId === userId);
  if (p) { p.socketId = socketId; p.isConnected = true; }
  return room;
}

function disconnectParticipant(code, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  const p = room.participants.find(p => p.socketId === socketId);
  if (p) p.isConnected = false;
}

/* ── AUCTION FLOW ──────────────────────────────────────────────── */
async function startAuction(code) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.participants.length < 2) return { error: 'Need at least 2 teams to start' };

  // load & shuffle player pool
  const players = await Player.find({ status: 'available' }).lean();
  room.playerPool = shuffleArray(players);
  room.currentIndex = 0;
  room.status = 'active';

  return { room, currentPlayer: room.playerPool[0] };
}

function getCurrentPlayer(code) {
  const room = rooms.get(code);
  if (!room) return null;
  return room.playerPool[room.currentIndex] || null;
}

function placeBid(code, { socketId, userId, teamId, teamName, username, amount }) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'active') return { error: 'Auction is not active' };

  const participant = room.participants.find(p => p.userId === userId);
  if (!participant) return { error: 'You are not in this room' };
  if (participant.teamId !== teamId) return { error: 'Team mismatch' };

  const currentPlayer = room.playerPool[room.currentIndex];
  if (!currentPlayer) return { error: 'No player on auction' };

  // Anti-spam: 1 bid per 500ms per team
  const lastBid = room.lastBidAt.get(teamId) || 0;
  if (Date.now() - lastBid < 500) return { error: 'Bidding too fast, slow down!' };

  // Validate amount
  const minBid = room.currentBid
    ? room.currentBid.amount + room.config.minBidIncrement
    : currentPlayer.basePrice;

  if (amount < minBid) return { error: `Minimum bid is ₹${minBid}L` };

  // Budget check
  const remaining = participant.budget - participant.spent;
  if (amount > remaining) return { error: `Insufficient budget. You have ₹${remaining}L remaining` };

  // Cannot bid on same player twice in a row
  if (room.currentBid?.teamId === teamId) return { error: 'You already have the highest bid!' };

  // Accept bid
  room.currentBid = { amount, teamId, teamName, username, timestamp: Date.now() };
  room.lastBidAt.set(teamId, Date.now());

  // Reset timer to 15s after each bid
  room.timeLeft = Math.min(room.timeLeft, 15);

  const entry = {
    playerId: currentPlayer._id?.toString(),
    playerName: currentPlayer.name,
    teamId, teamName, username, amount,
    timestamp: new Date(),
  };
  room.bidLog.push(entry);

  return { success: true, bid: room.currentBid, bidEntry: entry };
}

function soldPlayer(code) {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.playerPool[room.currentIndex];
  const bid = room.currentBid;

  if (!player) return null;

  const result = { player, bid, status: bid ? 'sold' : 'unsold' };

  if (bid) {
    // Update participant squad
    const participant = room.participants.find(p => p.teamId === bid.teamId);
    if (participant) {
      participant.spent += bid.amount;
      participant.squad.push({
        playerId: player._id?.toString(),
        name: player.name,
        role: player.role,
        nationality: player.nationality,
        isOverseas: player.isOverseas,
        price: bid.amount,
      });
    }
    room.soldCount++;
  } else {
    room.unsoldCount++;
  }

  return result;
}

function advanceToNextPlayer(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.currentIndex++;
  room.currentBid = null;
  room.timeLeft = room.timerSeconds;

  // Replenish with AI player if pool exhausted
  if (room.currentIndex >= room.playerPool.length) {
    const aiPlayer = generateAIPlayer(room.currentIndex);
    room.playerPool.push(aiPlayer);
  }

  const next = room.playerPool[room.currentIndex];
  return next;
}

function isAuctionComplete(code) {
  const room = rooms.get(code);
  if (!room) return true;
  // Auction ends when all human-controlled teams have less budget than min bid increment
  // or we've done 2x the initial pool size
  const initialPoolSize = room.playerPool.filter(p => !p.isAIGenerated).length;
  if (room.currentIndex >= initialPoolSize * 2) return true;
  return false;
}

function pauseAuction(code) {
  const room = rooms.get(code);
  if (!room) return false;
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
  room.status = 'paused';
  return true;
}

function resumeAuction(code) {
  const room = rooms.get(code);
  if (!room) return false;
  room.status = 'active';
  return true;
}

function endAuction(code) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
  room.status = 'ended';

  // Build leaderboard: sort by squad value descending
  const leaderboard = room.participants
    .map(p => ({
      teamId: p.teamId,
      teamName: p.teamName,
      username: p.username,
      primaryColor: p.primaryColor,
      squadCount: p.squad.length,
      spent: p.spent,
      budget: p.budget,
      remaining: p.budget - p.spent,
      squad: p.squad,
    }))
    .sort((a, b) => b.spent - a.spent);

  return { room, leaderboard };
}

function getRoomPublicState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  const { timerInterval, lastBidAt, playerPool, ...rest } = room;
  return {
    ...rest,
    playerPoolSize: playerPool.length,
    currentPlayer: playerPool[room.currentIndex] || null,
  };
}

function getLeaderboard(code) {
  const room = rooms.get(code);
  if (!room) return [];
  return room.participants
    .map(p => ({
      teamId: p.teamId, teamName: p.teamName, username: p.username,
      primaryColor: p.primaryColor, secondaryColor: p.secondaryColor,
      squadCount: p.squad.length, spent: p.spent,
      budget: p.budget, remaining: p.budget - p.spent,
      squad: p.squad,
    }))
    .sort((a, b) => b.spent - a.spent);
}

module.exports = {
  createRoom, getRoom, deleteRoom, joinRoom, rejoinRoom,
  disconnectParticipant, startAuction, getCurrentPlayer,
  placeBid, soldPlayer, advanceToNextPlayer, isAuctionComplete,
  pauseAuction, resumeAuction, endAuction,
  getRoomPublicState, getLeaderboard, rooms,
};
