const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: '/secrets/gcs-key.json', // this must match your --update-secrets path
});

const bucket = storage.bucket('quyncake-uploads');

module.exports = { storage, bucket };
 