const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const cart = require("../../models/cartModel")
const couponSchema = require("../../models/couponModel")



const loadCheckout = async  (req, res) => {
    try {
        if(!req.session.user){
            return res.redirect('login')
        }
      
        const userId = await req.session.userData._id
        const userCart = await cart.findOne({ user: userId }).populate('items.productId')
        const user = await userSchema.findOne({_id:userId})
        const address =  user.addresses
 

       console.log('adress',address);
       
      
        const totalQuantity = userCart.items.reduce((total, item) => total + item.quantity, 0);
        const totalAmount = userCart.items.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);
        coupons = await couponSchema.find()
        const availableCoupons = coupons.filter(coupon => totalAmount >= coupon.minimumPrice);

        
        
       
        
  
        res.render("checkout", {
            items: userCart.items,
            totalQuantity,
            totalAmount,
            address,
            availableCoupons,
            userCart
           
        })





       

       



        return res.render("checkout")
    } catch (error) {
        console.log(error)
    }



}








module.exports = {
    
    loadCheckout
}