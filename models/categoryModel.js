const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    isListed: {
        type: Boolean,
        required: true,
        default: true,
    },
    status: {
        type: String,
        required: true,
        default: "listed",
        
    }

}, { timestamps: true });  

module.exports = mongoose.model("Category", categorySchema);
