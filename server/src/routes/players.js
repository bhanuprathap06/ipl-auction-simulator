const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// GET /api/players - list all players
router.get('/', async (req, res) => {
  try {
    const { role, status, isOverseas } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (isOverseas !== undefined) filter.isOverseas = isOverseas === 'true';
    const players = await Player.find(filter).sort({ basePrice: -1 });
    res.json({ players, total: players.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
