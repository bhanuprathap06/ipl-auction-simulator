const express = require('express');
const router = express.Router();
const { getRoom, getRoomPublicState, getLeaderboard } = require('../services/auctionService');

// GET /api/rooms/:code - check if a room exists
router.get('/:code', (req, res) => {
  const state = getRoomPublicState(req.params.code.toUpperCase());
  if (!state) return res.status(404).json({ error: 'Room not found' });
  res.json({ room: state });
});

// GET /api/rooms/:code/leaderboard
router.get('/:code/leaderboard', (req, res) => {
  const lb = getLeaderboard(req.params.code.toUpperCase());
  res.json({ leaderboard: lb });
});

module.exports = router;
