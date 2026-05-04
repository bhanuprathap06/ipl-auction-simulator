const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    required: true,
  },
  nationality: { type: String, required: true },
  country: { type: String, default: 'India' },
  basePrice: { type: Number, required: true }, // in Lakhs (e.g., 20 = ₹20L)
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
  },
  isCapped: { type: Boolean, default: true },
  isOverseas: { type: Boolean, default: false },
  age: { type: Number },
  imageUrl: { type: String, default: '' },
  // auction state
  status: {
    type: String,
    enum: ['available', 'sold', 'unsold'],
    default: 'available',
  },
  soldTo: { type: String, default: null },     // team id
  soldPrice: { type: Number, default: null },  // in Lakhs
  isAIGenerated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
