const express = require('express');
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');
const router = express.Router();

const checkConflict = async (room_id, date, start_time, end_time, excludeId = null) => {
  let query = `
    SELECT id FROM reservations
    WHERE room_id = ? AND date = ? AND status = 'active'
    AND start_time < ? AND end_time > ?
  `;
  const params = [room_id, date, end_time, start_time];
  if (excludeId) { query += ' AND id != ?'; params.push(excludeId); }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.user_id, r.room_id,
             DATE_FORMAT(r.date, '%Y-%m-%d') as date,
             r.start_time, r.end_time, r.status, r.created_at,
             rm.name AS room_name, rm.location
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = ?
      ORDER BY r.date DESC, r.start_time DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/available', protect, async (req, res) => {
  const { room_id, date } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.start_time, r.end_time, u.name AS reserved_by
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.room_id = ? AND DATE_FORMAT(r.date, '%Y-%m-%d') = ? AND r.status = 'active'
      ORDER BY r.start_time
    `, [room_id, date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  const { room_id, date, start_time, end_time } = req.body;
  if (!room_id || !date || !start_time || !end_time)
    return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme' });
  if (start_time >= end_time)
    return res.status(400).json({ message: 'Ora e fillimit duhet të jetë para orës së mbarimit' });

  try {
    const conflict = await checkConflict(room_id, date, start_time, end_time);
    if (conflict)
      return res.status(409).json({ message: '⚠️ Salla është e rezervuar për këtë orar!' });

    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, room_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, room_id, date, start_time, end_time]
    );
    res.status(201).json({ id: result.insertId, message: '✅ Rezervimi u krye me sukses!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  const { date, start_time, end_time } = req.body;
  if (start_time >= end_time)
    return res.status(400).json({ message: 'Ora e fillimit duhet të jetë para orës së mbarimit' });

  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Rezervimi nuk u gjet' });

    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Nuk keni akses' });

    const conflict = await checkConflict(rows[0].room_id, date, start_time, end_time, req.params.id);
    if (conflict)
      return res.status(409).json({ message: '⚠️ Salla është e rezervuar për këtë orar!' });

    await pool.query(
      'UPDATE reservations SET date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [date, start_time, end_time, req.params.id]
    );
    res.json({ message: '✅ Orari u ndryshua me sukses!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Rezervimi nuk u gjet' });

    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Nuk keni akses' });

    await pool.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: '✅ Rezervimi u anulua' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;