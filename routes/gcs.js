const storage = new Storage({
  keyFilename: path.join(__dirname, 'gcs-key.json'),
});
const bucket = storage.bucket('quyncake-uploads'); // <--- YOUR BUCKET NAME
module.exports = { storage, bucket };
