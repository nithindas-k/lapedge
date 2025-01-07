const express = require('express');
const router = express.Router();
const checkoutController =require("../controllers/user/ckeckoutController");
const userLog = require('../middleware/userLoginCheck');


router.get("/",checkoutController.loadCheckout)




module.exports = router 