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
router.get("/order",adminAuth,adminController.loadAllOrder)
router.get("/orders/:orderId",adminAuth,adminController.loadOrderDetails)
router.put("/updateStatus/:orderId",adminAuth,adminController.updateOrderStatus)
router.put("/cancelOrder/:orderId",adminController.updatecancelOrder)



// admin product list page load
router.get("/products",adminAuth,adminController.loadAllProducts)

router.post("/products/toggle-block/:id", adminAuth, adminController.ToggleProductBlock);



router.get("/variant",adminController.LoadVariantManagement)

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/admin/login');
        }
        res.redirect('/admin/login');  
    });
});



//return 

router.put("/returnRequest/:itemId",adminAuth,adminController.returnRequestCancel)
router.put("/approveReturnRequest/:itemId",adminAuth,adminController.approve)
router.put("/approve",adminAuth,adminController.approveAll)


//user return
router.put("/returnOrder/:orderId",adminController.AllReturn)



//salesreport 
router.get("/salesreport",adminAuth,adminController.salesRepoetLoad)



//dowload 
router.get("/download",adminAuth,adminController.downloadPdf)

router.get("/sales-chart",adminAuth,adminController.sales)



module.exports = router;




