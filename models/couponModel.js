const mongoose = require('mongoose')

const CouponSchema = mongoose.Schema({
    code:{
        type:String,
        required:true
    },
    discountValue:{
        type:Number,
        required:true
    },
    maxDiscount:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date,
        required:true
    },
    expirationDate:{
        type:Date,
        required:true
    },
    maxUsage:{
        type:Number,
        required:true
    },
    currentUsage:{
        type:Number,
        default:0
    },
    minimumPrice: {
        type: Number,
        required:true
        
      },
    isActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
})

const Coupon = mongoose.model('Coupon',CouponSchema)
module.exports = Coupon