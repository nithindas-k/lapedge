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
        enum: ['Available', 'Out Of Stock', 'Discontinued'],
        required: true,
        default: 'Available'
    },
    specifications: {
        RAM: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        processor: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        displaySize: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        storage: { type:  mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true }
    }
}, { timestamps: true });

const product = mongoose.model('Product', productSchema);

module.exports = product;
