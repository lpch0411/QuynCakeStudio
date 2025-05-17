const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db/db');

// File upload config (images stored in /public/img)
const upload = multer({ dest: path.join(__dirname, '../public/img') });

// Create a new cake
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description, price, category } = req.body;
  const image = req.file ? `/img/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO cakes (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, description, price, image, category]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('❌ DB insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all available cakes
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM cakes ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available cakes by category
router.get('/', async (req, res) => {
  const { category } = req.query;
  let query = `SELECT * FROM cakes WHERE available = 1`;
  const params = [];

  if (category) {
    query += ` AND category = $1`;
    params.push(category);
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a cake
router.put('/:id', async (req, res) => {
  const { name, description, price, available, category } = req.body;
  try {
    await pool.query(
      `UPDATE cakes SET name = $1, description = $2, price = $3, available = $4, category = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
      [name, description, price, available, category, req.params.id]
    );
    res.json({ message: 'Cake updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle availability
router.patch('/:id/available', async (req, res) => {
  const { available } = req.body;
  try {
    await pool.query(
      `UPDATE cakes SET available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [available, req.params.id]
    );
    res.json({ message: 'Cake availability updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete permanently
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM cakes WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Cake permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
