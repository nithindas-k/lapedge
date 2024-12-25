const express = require('express');

const router = express.Router();
const offerManagement = require("../controllers/admin/offerManagement");
const {userAuth,adminAuth}= require("../middleware/auth")

router.get("/",adminAuth,offerManagement.loadOfferPage)
router.get("/add",adminAuth,offerManagement.addOfferPage)
router.post("/add",adminAuth,offerManagement.addOffer)
router.get('/category',adminAuth,offerManagement.getCategories);
router.get('/product', adminAuth,offerManagement.getProducts);
router.get("/edit/:id", adminAuth,offerManagement.loadEditPage);
router.delete("/detele/:id", adminAuth,offerManagement.deleteOffer)





module.exports = router

