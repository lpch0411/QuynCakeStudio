// gcs.js
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('quyncake-uploads');
module.exports = { bucket };
