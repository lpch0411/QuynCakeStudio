const { Storage } = require('@google-cloud/storage');   // <-- REQUIRED IMPORT
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, 'gcs-key.json'),
});
const bucket = storage.bucket('quyncake-uploads');

module.exports = { storage, bucket };
