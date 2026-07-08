const express = require("express")
const router = express.Router()
const userController = require("../controllers/user/userController")
const authCheck  =  require("../middleware/userAuth")
const userSessionCheck = require("../middleware/userSessionCheck")





const passport =require("../config/passport")



router.get('/',userController.loadHomepage)
router.get('/pageNotFound', userController.pageNotFound);
    router.get("/shop",userController.loadShopPage)


router.post('/verifyotp',userController.verifyOtp).get('/verifyotp',userController.loadverifyOtp)
router.post('/resentotp',userController.resendOTP)

router.get("/auth/google", passport.authenticate('google', { scope: ["profile", "email"] }));


router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: "/signup"}), 
    (req, res, next) => {
        console.log(req)
        if (!req.user) {
          
            const authInfo = req.authInfo;
            console.log(authInfo)
            if (authInfo && authInfo.message) {
                console.log(authInfo.message); 
            }
            return res.redirect('/signup');
        }
        console.log( req.user)
        req.session.userData = req.user
        req.session.user = true;
        res.redirect('/');
    }
);

router.get('/login',authCheck,userController.loadLoginPage).post('/login',userController.login)
router.get('/signup',authCheck, userController.loadSignup)
router.post('/signup', userController.signup)

router.get('/forgotOtp', userController.loadForgotPpassword);
router.post('/forgotOtp', userController.forgotOtp);

router.get("/forgotOtpVerify",userController.loadForgotOtpVerify)
router.post("/forgotOtpVerify", userController.forgotOtpVerify);


router.get("/forgotPassword",userController.loadResetPassword)
router.get("/productDetails/:id",userController.loadproductDetails)
router.post("/changePassword",userController.changePassword)



router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');  
    });
});

router.get("/account/:userId", userSessionCheck, userController.loadAccount)

router.get("/orders", userSessionCheck, userController.loadOrders)
router.get("/orders/:orderId", userSessionCheck, userController.loadOrdersDetails)



router.get('/profile-edit', userSessionCheck, userController.loadProfileEdit);
router.post('/profile-edit', userSessionCheck, userController.updateProfile);
router.get("/order-confirmation/:orderId", userSessionCheck, userController.loadOrderConfirmation)
router.get("/order-failed-confirmation/:razorpayId", userSessionCheck, userController.loadOrderFailure)
router.post("/order/retry-razorpay/:orderId", userSessionCheck, userController.retryPayment)

router.get("/productsFilter",userController.loadProductsFilter)

router.get("/Invoice/:orderId", userSessionCheck, userController.loadInvoice)
router.get("/404",userController.errorpage)



 

module.exports = router;  