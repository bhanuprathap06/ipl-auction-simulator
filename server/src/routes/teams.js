const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
