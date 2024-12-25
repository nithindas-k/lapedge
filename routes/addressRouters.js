const express = require('express');
const router = express.Router();
const addressController =require("../controllers/user/addressController");
const userLog = require('../middleware/userLoginCheck');


 
router.get("/create",addressController.loadCreateAddress)
router.post("/create/:userId",addressController.CreateAddress)
router.post("/create/:addressId",addressController.deleteAddress)
router.put("/edit/:addressId",addressController.editAddress)
router.delete("/:addressId", addressController.deleteAddress);
router.get("/edit/:addressId",addressController.loadAddressEdit)

router.get("/:userId", addressController.loadAddress)



module.exports = router