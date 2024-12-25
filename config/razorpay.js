
const Razorpay = require('razorpay');
const path = require('path');
require('dotenv').config();


console.log('Environment Variables Check:');
console.log('RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);



   


    

    const  razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

  
    




module.exports = razorpay
    
