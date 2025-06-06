// const { Storage } = require('@google-cloud/storage');

// const storage = new Storage(
//   {
//   keyFilename: './secrets/gcs-key.json', // this must match your --update-secrets path
// }
// );

// const bucket = storage.bucket('quyncake-upload');

// module.exports = { storage, bucket };
 

const { Storage } = require('@google-cloud/storage');

// No explicit keyFilename, use default Cloud Run credentials
const storage = new Storage();

const bucket = storage.bucket('quyncake-upload');

module.exports = { storage, bucket };
