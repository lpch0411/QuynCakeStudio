const { Storage } = require('@google-cloud/storage');

const storage = new Storage(); // <-- No options!
const bucket = storage.bucket('quyncake-uploads');

module.exports = { storage, bucket };
