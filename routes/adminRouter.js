const express = require(`express`)
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const userManagement = require("../controllers/admin/userManagement")
const {userAuth,adminAuth}= require("../middleware/auth")
const categoryRoutes = require("../routes/categoryRoutes"); 
const productManagement  = require("../controllers/admin/productManagement")
const variantmanagement = require("../controllers/admin/variantmanagement")


router.get("/error",adminController.error)
router.get("/login",adminController.loadLogin)
router.post("/login", adminController.login);
router.get("/dashboard",adminAuth,adminController.loadDashboard)


// uers

router.get("/users",adminAuth,userManagement.userInfo)
router.get("/blockUser",adminAuth,userManagement.userBlocked)
router.get("/unblockUser",adminAuth,userManagement.userunBlocked)
router.get("/viewUser",adminAuth,userManagement.loadUserView)



// admin product list page load
router.get("/products",adminAuth,adminController.loadAllProducts)

router.post("/products/toggle-block/:id", adminAuth, adminController.ToggleProductBlock);



router.get("/variant",adminController.LoadVariantManagement)



module.exports = router;




