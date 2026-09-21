const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../enums');

const OrderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            ProductId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            unitPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            },
            offerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Offer",
                default: null
            },
            status: {
                type: String,
                enum: Object.values(ORDER_STATUS),
                default: ORDER_STATUS.ORDERED
            },
            reason: {
                type: String,
                default: null
            }
        }
    ],
    shippingCharge: {
        type: Number
    },
    totalAmount: {
        type: Number,
        required: true
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    orderStatus: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING
    },
    paymentMethod: { 
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        required: true
    },
    paymentStatus:{
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        required: true,
        default: PAYMENT_STATUS.PENDING
    },
    payableAmount :{
        type: Number,
        required: true,
        default: 0
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    shippingAddress: {
        type: String,
        required: true
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
    },
    couponDiscount:{
        type: Number,
        default: 0
    },
    shippingDate: {
        type: Date,
        default: null
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String,
        default: null
    },
    returnReason: {
        type: String,
        default: null
    },
    isRejectedOnce:{
        type:Boolean,
        default:false
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    canceledAt: {
        type: Date,
        default: null
    },
    returnedAt: {
        type: Date,
        default: null
    },
    razorpayOrderId: {
        type: String,
        sparse: true  
    },
    paymentDetails: {
        razorpay_payment_id: String,
        razorpay_signature: String
    },
}, {
    timestamps: true
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;