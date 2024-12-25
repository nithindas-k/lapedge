
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/user/wishlistController');


router.get("/",wishlistController.loadWishlist)
router.post("/add",wishlistController.addWishlist)
router.post("/cart",wishlistController.addToCart)
router.delete("/delete/:productId",wishlistController.deleteWishlist)












module.exports = router;
