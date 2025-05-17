const express = require('express');
const router = express.Router();
const db = require('../db/db');
const multer = require('multer');
const path = require('path');

// File upload config (images stored in /public/img)
const upload = multer({
    dest: path.join(__dirname, '../public/img') // folder must exist
});

// Create a new cake (with optional image)
router.post('/', upload.single('image'), (req, res) => {
    const { name, description, price, category } = req.body;
    const image = req.file ? `/img/${req.file.filename}` : null;

    console.log('📝 New cake submission:');
    console.log('Name:', name);
    console.log('Description:', description);
    console.log('Price:', price);
    console.log('Price:', category);
    console.log('Image file:', req.file ? req.file.filename : 'None');

    db.run(
        `INSERT INTO cakes (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)`,
        [name, description, price, image, category],
        function (err) {
            if (err) {
                console.error('❌ DB insert error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('✅ Cake inserted into DB with ID:', this.lastID);
            res.status(201).json({ id: this.lastID });
        }
    );
});


// Get all available cakes
router.get('/all', (req, res) => {
    db.all(`SELECT * FROM cakes ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

//return available cakes
router.get('/', (req, res) => {
    const { category } = req.query;
    let query = `SELECT * FROM cakes WHERE available = 1`;
    const params = [];

    if (category) {
        query += ` AND category = ?`;
        params.push(category);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Update a cake (without changing image)
router.put('/:id', (req, res) => {
    const { name, description, price, available, category } = req.body;
    console.log('🛠 Update request for ID:', req.params.id);
    console.log('Received:', req.body);

    db.run(
        `UPDATE cakes SET name = ?, description = ?, price = ?, category = ?, available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, description, price, category, available, req.params.id],
        function (err) {
            if (err) {
                console.error('❌ DB update error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Cake updated' });
        }
    );
});

// Toggle availability only
router.patch('/:id/available', (req, res) => {
    const { available } = req.body;
    db.run(
        `UPDATE cakes SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [available, req.params.id],
        function (err) {
            if (err) {
                console.error('❌ Toggle error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Cake availability updated' });
        }
    );
});

//delete permanently
router.delete('/:id', (req, res) => {
    db.run(
        `DELETE FROM cakes WHERE id = ?`,
        [req.params.id],
        function (err) {
            if (err) {
                console.error('❌ Delete error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Cake permanently deleted.' });
        }
    );
});


module.exports = router;
