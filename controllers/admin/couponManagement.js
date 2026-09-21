const userSchema = require("../../models/userSchema")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Variant = require("../../models/variantModel")
const CouponSchema = require("../../models/couponModel")
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");

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
        
        return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.COUPON_CREATED_SUCCESS });


        
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
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND });
        }

        
        if(coupon.isActive == true) {
            coupon.isActive = false;
        }else{
            coupon.isActive = true;
        }


        await coupon.save();

        res.status(STATUS_CODES.OK).json({ success: true, message: `Coupon is now ${coupon.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.COUPON_STATUS_ERROR });
    }
};


const loadcouponEdit =  async (req, res) => {
    
    try {

        const {id} = req.params
        const coupon = await CouponSchema.findById(id)
        if(!coupon){
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND });
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
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND });
        }
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.COUPON_UPDATED_SUCCESS })

        
    } catch (error) {
        console.error(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.COUPON_UPDATE_FAILED })
        
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
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND_OR_INACTIVE });
        }
        const currentDate = new Date();
        if (currentDate > coupon.expirationDate) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_EXPIRED });
        }
        if (currentDate < coupon.startDate) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_NOT_ACTIVE_YET });
        }
        if(totalAmount < coupon.minimumPrice){
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_MIN_PRICE_NOT_MET });
        }
        if(coupon.maxUsage <= coupon.currentUsage){
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_MAX_USAGE_LIMIT });
        }
       

        let discountAmonut = 0 
        discountAmonut = parseInt((totalAmount * coupon.discountValue)/100)
        console.log(discountAmonut)

      
        totalAmount = totalAmount - discountAmonut
  

        await coupon.save()
        
        return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.COUPON_APPLIED_SUCCESS, discountAmonut: discountAmonut, totalAmount: totalAmount })

       
        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
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