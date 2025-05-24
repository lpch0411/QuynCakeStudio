const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: '/gcs-key.json',
});

const bucket = storage.bucket('quyncake-uploads');

module.exports = { storage, bucket };
 