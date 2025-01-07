const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
const productController = require("../controllers/admin/productManagement");


const storage = multer.memoryStorage(); 
const upload = multer({ storage });


router.get("/add", adminAuth, productController.LoadAddProduct);


router.post("/add", adminAuth, upload.array('images'),productController.CreateProduct);

router.get("/details", adminAuth, productController.loadProductDetails);
router.get("/update/:Id", adminAuth, productController.LoadupdateProduct);
router.put("/update/:Id", adminAuth, productController.updateProduct);
router.put("/update-image/:productId", adminAuth, upload.single("productImage"), productController.updateimage);

module.exports = router;
