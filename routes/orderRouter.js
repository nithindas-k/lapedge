const express = require('express');
const router = express.Router();
const orderController = require("../controllers/user/orderController")




router.post('/place-order',orderController.placeOrder)
router.post("/razorpay",orderController.razerpayorder)
router.post('/verify-payment', orderController.verifyPayment);
router.put("/cancel", orderController.cancel)
router.put("/return", orderController.OrderrReturn)








module.exports = router