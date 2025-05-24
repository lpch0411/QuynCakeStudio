const express = require('express');
const router = express.Router();
const multer = require('multer');
const { bucket } = require('../gcs'); // Assumes gcs.js exports: { bucket }
const pool = require('../db/db');

// Use in-memory storage for uploads (recommended for cloud uploads)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Create a new cake with optional image upload to GCS.
 */
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description, price, category } = req.body;
  let imageUrl = null;

  try {
    // If image is uploaded, upload to GCS
    if (req.file) {
      const gcsFileName = `${Date.now()}-${req.file.originalname}`;
      const blob = bucket.file(gcsFileName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: req.file.mimetype },
      });

      blobStream.on('error', (err) => {
        console.error('GCS upload error:', err);
        return res.status(500).json({ error: 'Image upload failed' });
      });

      blobStream.on('finish', async () => {
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;
        try {
          const result = await pool.query(
            `INSERT INTO cakes (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, description, price, imageUrl, category]
          );
          res.status(201).json({ id: result.rows[0].id });
        } catch (dbErr) {
          console.error('DB insert error:', dbErr);
          res.status(500).json({ error: dbErr.message });
        }
      });

      // Start upload
      blobStream.end(req.file.buffer);

    } else {
      // No image: just insert the cake
      const result = await pool.query(
        `INSERT INTO cakes (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, description, price, null, category]
      );
      res.status(201).json({ id: result.rows[0].id });
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all cakes (admin view)
 */
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM cakes ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
