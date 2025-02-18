const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,  
        required: true
    },
    brand: {
        type: String,  
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    regularPrice: {
        type: Number,  
        required: true
    },
    salePrice: {
        type: Number,  
        required: true
    },
    productOffer: {
        type: Number,  
        default: 0
    },
    quantity: {
        type: Number,  
        default: true
    },
    productImage: [{
        type: String, 
        required: true
    }],
    isBlocked: {
        type: Boolean, 
        default: false
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Hurry up!'],
        required: true,
        default: 'Available'
    },
    offerPersentage :{
        type: Number,
        default: 0      

    },
    specifications: {
        RAM: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        processor: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        displaySize: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        storage: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true }
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
