const express = require('express');
const router = express.Router();
const couponManagement = require("../controllers/admin/couponManagement")
const {userAuth,adminAuth}= require("../middleware/auth")

router.get("/",adminAuth,couponManagement.loadCouponPage)
router.get("/add",adminAuth,couponManagement.loadCouponAddPage)
router.post("/add",adminAuth,couponManagement.addcoupon)
router.post('/toggle/:id',adminAuth,couponManagement.toggleCouponListing);
router.get('/edit/:id',adminAuth,couponManagement.loadcouponEdit);
router.post('/edit/:id',adminAuth,couponManagement.couponEdit);
router.post("/apply",couponManagement.couponApply)




module.exports = router