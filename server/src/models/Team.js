const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },   // e.g. 'MI'
  name: { type: String, required: true },                // e.g. 'Mumbai Indians'
  shortName: { type: String, required: true },           // e.g. 'MI'
  primaryColor: { type: String, default: '#004BA0' },
  secondaryColor: { type: String, default: '#FFFFFF' },
  logoEmoji: { type: String, default: '🏏' },
  homeGround: { type: String },
  maxPlayers: { type: Number, default: 25 },
  maxOverseas: { type: Number, default: 8 },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
