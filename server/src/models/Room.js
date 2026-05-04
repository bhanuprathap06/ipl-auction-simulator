const mongoose = require('mongoose');

const squadPlayerSchema = new mongoose.Schema({
  playerId: String,
  name: String,
  role: String,
  nationality: String,
  isOverseas: Boolean,
  price: Number,  // in Lakhs
}, { _id: false });

const participantSchema = new mongoose.Schema({
  socketId: String,
  userId: String,   // generated client-side and stored in sessionStorage
  username: String,
  teamId: String,   // which IPL franchise they own
  teamName: String,
  budget: { type: Number, default: 12000 }, // in Lakhs (120 Cr)
  spent: { type: Number, default: 0 },
  squad: [squadPlayerSchema],
  isHost: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const bidLogSchema = new mongoose.Schema({
  playerId: String,
  playerName: String,
  teamId: String,
  teamName: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  hostSocketId: String,
  hostUserId: String,
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'ended'],
    default: 'waiting',
  },
  participants: [participantSchema],
  // auction config
  auctionConfig: {
    totalBudget: { type: Number, default: 12000 }, // in Lakhs
    timerSeconds: { type: Number, default: 30 },
    minBidIncrement: { type: Number, default: 25 }, // in Lakhs
    maxOverseasPerTeam: { type: Number, default: 8 },
    maxPlayersPerTeam: { type: Number, default: 25 },
  },
  // player pool (array of player IDs in shuffled order)
  playerPool: [String],
  currentPlayerIndex: { type: Number, default: 0 },
  // bid log
  bidLog: [bidLogSchema],
  // results
  soldPlayers: { type: Number, default: 0 },
  unsoldPlayers: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
