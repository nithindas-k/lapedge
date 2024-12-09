const express = require("express")
const router = express.Router()
const userController = require("../controllers/user/userController")

const passport =require("../config/passport")

 

router.get('/',userController.loadHomepage)
router.get('/pageNotFound', userController.pageNotFound);
router.get("/shop",userController.loadShopPage)


router.post('/verifyotp',userController.verifyOtp).get('/verifyotp',userController.loadverifyOtp)
router.post('/resentotp',userController.resendOTP)

router.get("/auth/google", passport.authenticate('google', { scope: ["profile", "email"] }));

// router.get('/auth/google/callback', 
//     passport.authenticate('google', { failureRedirect: "/signup" }), 
//     (req, res) => {
//         req.session.user=true
//         res.redirect('/');
//     });
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
        
        
        req.session.user = true;
        res.redirect('/');
    }
);

router.get('/login',userController.loadLoginPage).post('/login',userController.login)
router.get('/signup', userController.loadSignup)
router.post('/signup', userController.signup)

router.get('/forgotOtp', userController.loadForgotPpassword);
router.post('/forgotOtp', userController.forgotOtp);

router.get("/forgotOtpVerify",userController.loadForgotOtpVerify)
router.post("/forgotOtpVerify", userController.forgotOtpVerify);


router.get("/forgotPassword",userController.loadResetPassword)
router.get("/productDetails/:id",userController.loadproductDetails)

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');  
    });
});


module.exports = router;  