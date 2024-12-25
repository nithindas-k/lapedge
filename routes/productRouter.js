const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
const productController = require("../controllers/admin/productManagement");

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Uploading")
        cb(null, path.join(__dirname, '../public/uploads/products')); 
    },
    filename: (req, file, cb) => {
        console.log(file.originalname)
        cb(null, Date.now() + path.extname(file.originalname));  // Unique filename with timestamp
    }
});


const upload = multer({ storage });


router.get("/add", adminAuth, productController.LoadAddProduct);


router.post("/add", adminAuth, upload.fields([
    {name:"productImage1"},
    {name:"productImage2"},
    {name:"productImage3"}
]), productController.CreateProduct);

router.get("/details",adminAuth,productController.loadProductDetails)
router.get("/update/:Id",adminAuth,productController.LoadupdateProduct);
router.put("/update/:Id", adminAuth, productController.updateProduct);
router.put("/update-image/:productId",adminAuth,upload.single("productImage"),productController.updateimage);





module.exports = router;
