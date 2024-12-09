const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/admin/categoryManagement");
const { adminAuth } = require("../middleware/auth"); 
const upload = require("../config/multer"); 




router.get("/", adminAuth, categoryController.loadCategories);


router.get("/create", adminAuth, categoryController.loadCreateCategory);


router.post("/create", upload.single('image'), categoryController.createCategory);


router.get("/edit/:id", adminAuth, categoryController.loadEditCategory);


router.post("/edit/:id", upload.single('image'), categoryController.updateCategory);
router.get("/toggle-list/:id", adminAuth, categoryController.toggleCategoryListing);
router.post("/toggle-list/:id", adminAuth, categoryController.toggleCategoryListing);






module.exports = router;
