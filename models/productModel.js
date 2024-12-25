const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,  // Corrected 'string' to String
        required: true
    },
    description: {
        type: String,  // Corrected 'string' to String
        required: true
    },
    brand: {
        type: String,  // Corrected 'string' to String
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    regularPrice: {
        type: Number,  // Corrected 'number' to Number
        required: true
    },
    salePrice: {
        type: Number,  // Corrected 'number' to Number
        required: true
    },
    productOffer: {
        type: Number,  // Corrected 'number' to Number
        default: 0
    },
    quantity: {
        type: Number,  // Corrected 'number' to Number
        default: true
    },
    productImage: [{
        type: String,  // Corrected 'string' to String
        required: true
    }],
    isBlocked: {
        type: Boolean,  // Corrected 'boolean' to Boolean
        default: false
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Hurry up !'],
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
