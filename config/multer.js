const Multer = require('multer');
const path = require('path');
const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});


module.exports = upload;
