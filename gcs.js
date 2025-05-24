// gcs.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, 'gcs-key.json'), // Adjust if path differs
});
const bucket = storage.bucket('quyncake-uploads'); // Use your bucket name

module.exports = { storage, bucket };
