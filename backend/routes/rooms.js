const express = require('express');
const { pool } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/rooms - Lista e sallave
router.get('/', protect, async (req, res) => {
  try {
    const [rooms] = await pool.query(
      'SELECT * FROM rooms WHERE is_active = TRUE ORDER BY name'
    );
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Gabim serveri' });
  }
});

// GET /api/rooms/:id - Detaje sallës + rezervimet e saj
router.get('/:id', protect, async (req, res) => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (rooms.length === 0) return res.status(404).json({ message: 'Salla nuk u gjet' });
    res.json(rooms[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gabim serveri' });
  }
});

// POST /api/rooms - Shto sallë (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, location, capacity, equipment } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO rooms (name, location, capacity, equipment) VALUES (?, ?, ?, ?)',
      [name, location, capacity, JSON.stringify(equipment || [])]
    );
    res.status(201).json({ id: result.insertId, name, location, capacity, equipment });
  } catch (err) {
    res.status(500).json({ message: 'Gabim serveri' });
  }
});

// DELETE /api/rooms/:id - Fshi sallë (admin) - soft delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE rooms SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Salla u fshi me sukses' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim serveri' });
  }
});

module.exports = router;