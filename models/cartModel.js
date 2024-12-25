const mongoose = require('mongoose')

const itemInfoSchema = mongoose.Schema({
    productId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"Product"
    },
    quantity:{
        type:Number,
        required:true
    },
    addedAt:{
       type:Date,
       default:Date.now
    }
})

const CartSchema = mongoose.Schema({
   user:{
    type:mongoose.Types.ObjectId,
    required:true,
   },
   items:[itemInfoSchema],
   totalQuantity:{
    type:Number,
    default:0
   },
   totalAmount:{
    type:Number,
    default:0
   }
},{
   timestamps:true
});


const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;