const mongoose =require("mongoose")
const {Schema} = mongoose

const variantSchema = new mongoose.Schema({
  
    category: {
        type: String,
        required: true,  
        enum: ['ram', 'processor', 'display', 'storage'],  
    },
    value: {
        type: String,
        required: true,  
    },
    isBlocked: {
        type: Boolean,
        default: false, 
    },
  
}, { timestamps: true }); 

module.exports = mongoose.model('Variant', variantSchema);