const userSchema = require("../../models/userSchema")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Variant = require("../../models/variantModel")
const CouponSchema = require("../../models/couponModel")

const productSchema = require("../../models/productModel")
const Order = require("../../models/orderModel")
const cartSchema = require("../../models/cartModel")

const loadCouponPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  
        const limit = 5;  
        const skip = (page - 1) * limit;  
        const totalCoupons = await CouponSchema.countDocuments(); 
        const totalPages = Math.ceil(totalCoupons / limit);  

        const coupons = await CouponSchema.find()
            .skip(skip)  
            .limit(limit);  

        res.render("coupon", {
            coupons: coupons,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Error loading coupons:", error);
        res.redirect("/pageNotFound");
    }
};

const loadCouponAddPage = async ( req , res )=>{

    try {

        res.render("couponAdd")

        
    } catch (error) {
        res.redirect("/pageNotFound")
        
    }
}

const addcoupon = async ( req , res )=>{
    try {

        const { code, discountValue, startDate,expirationDate,maxUsage,minimumPrice } = req.body;
        const coupon = new CouponSchema({
            code: code,
            discountValue: discountValue,
     
            startDate: startDate,
            expirationDate: expirationDate,
            maxUsage: maxUsage,
            minimumPrice: minimumPrice
        })
        await coupon.save()
        
        return res.status(200).json({ success: true, message: "Coupon created successfully." });


        
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound")

        
    }
}


const toggleCouponListing = async (req, res) => {
    try {
        const couponId = req.params.id;
      
        const coupon = await CouponSchema.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        
        if(coupon.isActive == true) {
            coupon.isActive = false;
        }else{
            coupon.isActive = true;
        }


        await coupon.save();

        res.json({ success: true, message: `Coupon is now ${coupon.active ? 'Active' : 'Inactive'}` });
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).json({ success: false, message: 'Server error while toggling coupon status' });
    }
};


const loadcouponEdit =  async (req, res) => {
    
    try {

        const {id} = req.params
        const coupon = await CouponSchema.findById(id)
        if(!coupon){
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

       
      
        res.render('couponEdit',{
            coupon
        })

    } catch (error) {
        console.error(error)
        res.redirect('/pageNotFound')
        
    }



}

const couponEdit   = async (req, res) => {
    try {

        const {id} = req.params
        const { code, discountValue, startDate, expirationDate, maxUsage, minimumPrice } = req.body;
        const coupon = await CouponSchema.findByIdAndUpdate(id, {
            code: code,
            discountValue: discountValue,
            
            startDate: startDate,
            expirationDate: expirationDate,
            maxUsage: maxUsage,
            minimumPrice: minimumPrice
        })
        if(!coupon){
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, message: 'Coupon updated successfully' })

        
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Failed to update coupon' })
        
    }
}

const couponApply =  async (req, res) => {
    try {
       
        
        let { couponCode,totalAmount } = req.body;
        console.log(couponCode, totalAmount)
        totalAmount=parseInt(totalAmount)

        const coupon = await CouponSchema.findOne({ code: couponCode, isActive: true})
        console.log(coupon)
        
        if(!coupon){
            return res.json({ success: false, message: 'Coupon not found or not active' });
        }
        if(coupon.startDate > coupon.expirationDate ){
            return res.json({ success: false, message: 'Coupon expired' });
        }
        if(totalAmount < coupon.minimumPrice){
            return res.json({ success: false, message: 'Coupon minimum price not met' });
        }
        if(coupon.maxUsage <= coupon.currentUsage){
            return res.json({ success: false, message: 'Coupon has reached its maximum usage limit' });
        }
       

        let discountAmonut = 0 
        discountAmonut = parseInt((totalAmount * coupon.discountValue)/100)
        console.log(discountAmonut)

      
        totalAmount = totalAmount - discountAmonut
  

        coupon.save()
        
        return res.json({ success: true, message: 'Coupon applied successfully', discountAmonut: discountAmonut, totalAmount: totalAmount })

       
        
    } catch (error) {

        console.log(error)
        
    }


}



module.exports = {
loadCouponPage,
loadCouponAddPage,
addcoupon,
toggleCouponListing,
loadcouponEdit,
couponEdit,
couponApply


}   