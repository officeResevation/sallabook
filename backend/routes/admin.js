const express = require('express');
const { pool } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/reservations', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.user_id, r.room_id,
             DATE_FORMAT(r.date, '%Y-%m-%d') as date,
             r.start_time, r.end_time, r.status, r.created_at,
             rm.name AS room_name, rm.location,
             u.name AS user_name, u.email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.date DESC, r.start_time DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/reservations/:id', protect, adminOnly, async (req, res) => {
  const { date, start_time, end_time } = req.body;
  if (start_time >= end_time)
    return res.status(400).json({ message: 'Ora e fillimit duhet të jetë para orës së mbarimit' });

  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Rezervimi nuk u gjet' });

    const [conflict] = await pool.query(`
      SELECT id FROM reservations
      WHERE room_id = ? AND date = ? AND status = 'active'
      AND start_time < ? AND end_time > ? AND id != ?
    `, [rows[0].room_id, date, end_time, start_time, req.params.id]);

    if (conflict.length > 0)
      return res.status(409).json({ message: '⚠️ Përplasje orari! Salla është e zënë.' });

    await pool.query(
      'UPDATE reservations SET date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [date, start_time, end_time, req.params.id]
    );
    res.json({ message: '✅ Orari u ndryshua!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/reservations/:id', protect, adminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: '✅ Rezervimi u fshi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [[{ total_reservations }]] = await pool.query(
      "SELECT COUNT(*) AS total_reservations FROM reservations WHERE status = 'active'"
    );
    const [[{ total_rooms }]] = await pool.query(
      'SELECT COUNT(*) AS total_rooms FROM rooms WHERE is_active = TRUE'
    );
    const [[{ total_users }]] = await pool.query(
      'SELECT COUNT(*) AS total_users FROM users WHERE role = "user"'
    );
    const [topRooms] = await pool.query(`
      SELECT rm.name, COUNT(r.id) AS total
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.status = 'active'
      GROUP BY rm.id ORDER BY total DESC LIMIT 5
    `);
    const [dailyStats] = await pool.query(`
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, COUNT(*) AS count
      FROM reservations
      WHERE status = 'active' AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date ORDER BY date
    `);
    res.json({ total_reservations, total_rooms, total_users, topRooms, dailyStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;