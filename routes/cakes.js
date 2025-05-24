const express = require('express');
const router = express.Router();
const multer = require('multer');
const { bucket } = require('../gcs'); // Assumes gcs.js exports: { bucket }
const pool = require('../db/db');

console.log("🚀 cakes.js loaded", new Date().toISOString());

// Use in-memory storage for uploads (recommended for cloud uploads)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Create a new cake with optional image upload to GCS.
 * - Only inserts the cake if the image (if present) uploads successfully.
 * - If image upload fails, responds with 500 and does NOT insert the cake.
 */
router.post('/', upload.single('image'), async (req, res) => {
  console.log("POST /api/cakes called at", new Date().toISOString());
  const { name, description, price, category } = req.body;
  let imageUrl = null;

  try {
    if (req.file) {
      const gcsFileName = `${Date.now()}-${req.file.originalname}`;
      const blob = bucket.file(gcsFileName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: req.file.mimetype },
      });

      let errorHandled = false; // Prevent multiple responses

      blobStream.on('error', (err) => {
        console.error('GCS Upload Error:', err);
        if (!errorHandled) {
          errorHandled = true;
          // Always respond and end the request if upload fails
          if (!res.headersSent) {
            res.status(500).json({ error: 'Image upload failed: ' + err.message });
          }
        }
      });

      blobStream.on('finish', async () => {
        if (errorHandled) return; // Already handled by error
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;
        try {
          const result = await pool.query(
            `INSERT INTO cakes (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, description, price, imageUrl, category]
          );
          res.status(201).json({ id: result.rows[0].id });
        } catch (dbErr) {
          console.error('DB insert error:', dbErr);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Database error: ' + dbErr.message });
          }
        }
      });

      blobStream.end(req.file.buffer);

    } else {
      // No image uploaded: normal DB insert
      const result = await pool.query(
        `INSERT INTO cakes (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, description, price, null, category]
      );
      res.status(201).json({ id: result.rows[0].id });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * Get all cakes (admin view)
 */
router.get('/all', async (req, res) => {
  console.log("🚀 all cakes loaded", new Date().toISOString());
  try {
    const result = await pool.query(`SELECT * FROM cakes ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cakes:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get cakes by category (public)
 */
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
    console.error('Error fetching cakes:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update a cake (admin)
 */
router.put('/:id', async (req, res) => {
  const { name, description, price, available, category } = req.body;
  try {
    await pool.query(
      `UPDATE cakes SET name = $1, description = $2, price = $3, available = $4, category = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
      [name, description, price, available, category, req.params.id]
    );
    res.json({ message: 'Cake updated' });
  } catch (err) {
    console.error('Error updating cake:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle cake availability (admin)
 */
router.patch('/:id/available', async (req, res) => {
  const { available } = req.body;
  try {
    await pool.query(
      `UPDATE cakes SET available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [available, req.params.id]
    );
    res.json({ message: 'Cake availability updated' });
  } catch (err) {
    console.error('Error toggling cake availability:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a cake (admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM cakes WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Cake permanently deleted.' });
  } catch (err) {
    console.error('Error deleting cake:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
