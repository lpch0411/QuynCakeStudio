const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../cakes.db'), err => {
  if (err) return console.error('DB Error:', err.message);
  console.log('Connected to SQLite DB');
});

// Ensure table exists (initial creation)
db.run(`
  CREATE TABLE IF NOT EXISTS cakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add 'image' column if missing
db.get(`PRAGMA table_info(cakes)`, (err, info) => {
  if (err) return console.error('PRAGMA error:', err.message);
  db.all(`PRAGMA table_info(cakes)`, (err, columns) => {
    const hasImage = columns.some(col => col.name === 'image');
    if (!hasImage) {
      db.run(`ALTER TABLE cakes ADD COLUMN image TEXT`, err => {
        if (err) {
          console.error('❌ Failed to add image column:', err.message);
        } else {
          console.log('✅ Image column added to cakes table.');
        }
      });
    } else {
      console.log('✅ Image column already exists.');
    }
  });
});

// Add 'category' column if missing
db.all(`PRAGMA table_info(cakes)`, (err, columns) => {
  const hasCategory = columns.some(col => col.name === 'category');
  if (!hasCategory) {
    db.run(`ALTER TABLE cakes ADD COLUMN category TEXT`, err => {
      if (err) {
        console.error('❌ Failed to add category column:', err.message);
      } else {
        console.log('✅ Category column added to cakes table.');
      }
    });
  }
});

module.exports = db;
