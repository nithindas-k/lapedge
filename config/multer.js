const multer = require('multer');
const path = require('path');


const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

//  create it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//save in public-uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
        
    }
});



const upload = multer({ storage: storage });

module.exports = upload;
