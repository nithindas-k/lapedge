const mongoose = require('mongoose')

const wishlistSchema = mongoose.Schema({
    userId:{
    type:mongoose.Types.ObjectId,
    ref:"User"
  },
  items:[{
    type:mongoose.Types.ObjectId,
    ref:"Product"
  }]
},{
    timestamps:true
})

const Wishlist = mongoose.model('Wishlist',wishlistSchema)
module.exports = Wishlist