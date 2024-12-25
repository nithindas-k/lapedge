const express = require("express");
const router = express.Router();
const cartController = require("../controllers/user/cartController")



router.get("/", cartController.loadCart)

router.post("/add",cartController.addCart)
router.delete("/delete",cartController.deleteCart)
router.post("/update-quantity",cartController.updateQuantity)


module.exports = router