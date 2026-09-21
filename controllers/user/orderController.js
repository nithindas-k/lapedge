const Order = require('../../models/orderModel');
const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const User = require('../../models/userSchema');
const couponSchema = require("../../models/couponModel");
const crypto = require('crypto');
const razorpay = require('../../config/razorpay');
const Coupon =  require("../../models/couponModel")
const Wallet = require("../../models/wallet")
const Transaction  = require("../../models/waletTrancations")
const { STATUS_CODES, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../../enums');
const { MESSAGES } = require('../../constants');
require("dotenv").config();


const generateOrderId = () => {
   
    const randomNum = Math.floor(100000 + Math.random() * 900000);
  
    return `ORD-${randomNum}`;
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userData._id;
        let { addressId, paymentMethod, disamount, couponCode } = req.body;

     

        if (!addressId || !paymentMethod) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.ADDRESS_AND_PAYMENT_REQUIRED,
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.CART_EMPTY,
            });
        }

        const orderItems = cart.items.map((item) => ({
            ProductId: item.productId._id,
            quantity: item.quantity,
            unitPrice: item.productId.salePrice,
            totalPrice: item.quantity * item.productId.salePrice,
        }));

        let totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);
        let payableAmount = totalAmount;

        if(payableAmount > 1000){
            return res.status(STATUS_CODES.NOT_FOUND).json({success:false,message:MESSAGES.COD_NOT_AVAILABLE})
        }

        if (couponCode && couponCode !== null) {
            var coupon = await Coupon.findOne({ code: couponCode });
            if (coupon && coupon.currentUsage < coupon.maxUsage) {
                payableAmount = totalAmount - parseInt((totalAmount * coupon.discountValue) / 100);
                coupon.currentUsage++;
                await coupon.save();
            }
        }

        console.log("++++++++++++++++++++++++++++",couponCode)
       


        const user = await User.findById(userId);
        const { name, phone, pincode, state, address, city } = user.addresses.find(
            (addr) => addr._id.toString() === addressId
        );
        
      let couponDiscount  = totalAmount - payableAmount
        const newOrder = new Order({
            userId,
            items: orderItems,
            totalAmount,
            paymentMethod,
            couponDiscount:couponDiscount,
            shippingAddress: `${name},${phone},${pincode},${state},${address},${city}`,
            orderStatus: ORDER_STATUS.ORDERED,
            paymentStatus: paymentMethod === PAYMENT_METHOD.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.SUCCESS,
            coupon: coupon?._id || null,
            payableAmount:payableAmount

        });


        await newOrder.save();
        
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.ProductId,
                { $inc: { quantity: -item.quantity } }, 
                { new: true }
            );
        }

        


        


        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [], totalAmount: 0 } }
        );

        res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: MESSAGES.ORDER_PLACED_SUCCESS,
            newOrder,
        });
    } catch (error) {
        console.error('Order Placement Error:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.ORDER_FAILED,
            error: error.message
        });
    }
};

const razerpayorder = async (req, res) => {
    try {
        
        const userId = req.session.userData._id;
        if (!userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { addressId, paymentMethod, couponCode } = req.body;
        
        if (!addressId || !paymentMethod) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.USER_NOT_FOUND
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.CART_EMPTY
            });
        }

        const orderItems = cart.items.map((item) => ({
            ProductId: item.productId._id,
            quantity: item.quantity,
            unitPrice: item.productId.salePrice,
            totalPrice: item.quantity * item.productId.salePrice,
        }));

        let totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);
        let payableAmount = totalAmount;
        let couponDiscount = 0;
        let coupon = null;

        if (couponCode && couponCode !== 'null' && couponCode !== '') {
            coupon = await Coupon.findOne({ code: couponCode });
            if (coupon && coupon.currentUsage < coupon.maxUsage) {
                const discount = parseInt((totalAmount * coupon.discountValue) / 100);
                payableAmount = totalAmount - discount;
                couponDiscount = discount;
            }
        }

        const amountInPaise = Math.round(parseFloat(payableAmount) * 100);

        
        const shippingAddress = user.addresses.find(
            (addr) => addr._id.toString() === addressId
        );
        if (!shippingAddress) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: 'Invalid address selected'
            });
        }

      
        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            payment_capture: 1
        };

        console.log("orderOptions +++  ++ ++ " ,orderOptions)
           
            
            const razorpayOrder = await razorpay.orders.create(orderOptions);
            console.log("id"  + razorpayOrder.id)
            const customOrderId = generateOrderId();

        const newOrder = new Order({
            userId,
            items: orderItems,
            totalAmount:totalAmount,
            paymentMethod,
            shippingAddress: `${shippingAddress.name},${shippingAddress.phone},${shippingAddress.pincode},${shippingAddress.state},${shippingAddress.address},${shippingAddress.city}`,
            orderStatus: ORDER_STATUS.PENDING,
            paymentStatus: PAYMENT_STATUS.PENDING,
            coupon: coupon?._id || null,
            razorpayOrderId: razorpayOrder.id,
            payableAmount:payableAmount,
            couponDiscount:couponDiscount,
            orderId:customOrderId
        });


        await newOrder.save();
        if(coupon){

            coupon.currentUsage+=1
            await coupon.save()
        }
       

        

     
        const response = {
            success: true,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            amount: amountInPaise,
            orderId: razorpayOrder.id,
            order_id: newOrder._id, 
            prefill: {
                name: user.name || '',
                email: user.email || '',
                contact: user.phone || ''
            }
        };
       
        return res.status(STATUS_CODES.OK).json(response);

    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        console.log(razorpay_payment_id, razorpay_order_id,razorpay_signature )
        
      
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

            console.log("1")



        if (razorpay_signature !== expectedSign) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        console.log("2")
        console.log(razorpay_order_id)

        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

        console.log(order)
        if (!order) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ORDER_NOT_FOUND
            });
        }

        console.log("3")
        order.paymentStatus = PAYMENT_STATUS.SUCCESS;
        order.orderStatus = ORDER_STATUS.ORDERED;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();
        console.log("4")
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.ProductId,
                { $inc: { quantity: -item.quantity } }, 
                { new: true }
            );
        }

        console.log("5")
        await Cart.findOneAndUpdate(
            { user: order.userId },
            { $set: { items: [], totalAmount: 0 } }
        );


        console.log("6")
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.PAYMENT_VERIFIED_SUCCESS,
            orderId: order._id
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.PAYMENT_VERIFICATION_FAILED,
            error: error.message
        });
    }
};



const cancel =  async (req, res) => {
    try {        
        let {orderItemId,orderId , cancelReason}= req.body
        console.log(orderItemId, orderId)
       
        

        const order =  await Order.findById(orderId)
        const couponId  = order.coupon 
  
        const couponData = await Coupon.findOne({_id:couponId})


        console.log("this is the coupon data "+couponData)



        for(let i = 0 ;i<order.items.length;i++) {
            console.log(order.items[i].ProductId.toString(),orderItemId)
            if(order.items[i].ProductId.toString() == orderItemId) {
                 console.log(true)
                order.items[i].status = ORDER_STATUS.CANCELLED
                order.items[i].reason = cancelReason || null
                const product  = await Product.findById(orderItemId)
                product.quantity += order.items[i].quantity
               
                let qstatus = ""
                if (product.quantity == 0) {
                    qstatus = "Out Of Stock"
                } else if (product.quantity > 5) {
                    qstatus = "Available"
                } else if (product.quantity <= 5) {
        
                    qstatus = "Hurry up!"
                }
                product.status = qstatus
        
                await product.save()


                if(order.paymentStatus == PAYMENT_STATUS.SUCCESS || order.paymentStatus == "Success"){
                    const orderTotal = order.totalAmount
                    const itemTotal = order.items[i].totalPrice
                    let count = order.items.length


                    let amount  = itemTotal  

                    if(order.couponDiscount > 0){
                        console.log("trueeeeeeeeeeeeeeeeee")

                        
                        
                            var proptionalDiscount = itemTotal / order.totalAmount * order.couponDiscount
                            amount = itemTotal - proptionalDiscount.toFixed()



                                console.log("+++++++++++++++++",amount)

                    }

                    
                    const userWallet = await Wallet.findOneAndUpdate({ userId: order.userId }, {
                        $inc: {
                            balance: amount
                        }
                    }, { upsert: true, new: true })
                    await Transaction.create({
                        userId: order.userId,
                        walletId: userWallet._id,
                        type: 'credit',
                        amount: amount,
                        associatedOrder: order._id
                    })

                   
                    



                }
                order.payableAmount =  order.payableAmount - order.items[i].totalPrice
                if(couponData && order.payableAmount < couponData.minimumPrice){
                    let newPayableAmount = 0
                    for(let item of order.items){
                       if(item.status !== ORDER_STATUS.CANCELLED){
                         newPayableAmount += item.totalPrice
                       }
                    }
                    order.payableAmount = newPayableAmount
                    order.coupon = null
                    order.couponDiscount = 0
                }
                break;
            }
        }
        const itemStatuses = order.items.map(item => item.status)
        const isAllItemsCancelled = itemStatuses.every((status) => status == ORDER_STATUS.CANCELLED)
        if (isAllItemsCancelled) {
            order.orderStatus = ORDER_STATUS.CANCELLED
            order.cancellationReason = "All Items Are Cancelled"
        }
        await order.save()
        res.status(STATUS_CODES.OK).json({ success: true, isAllItemsCancelled })

    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR })
    }
}
 

const OrderrReturn =  async (req , res) => {
    try {
        const {orderItemId , orderId,returnReason}=req.body
        const order =  await Order.findById(orderId)
        const item = order.items.find(item => item.ProductId.toString() == orderItemId)
        if(!item) return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ITEM_NOT_FOUND })
            item.status = ORDER_STATUS.RETURN_REQUESTED
            item.reason = returnReason || null
            await order.save()
        
            
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ITEM_RETURNED_SUCCESS })

        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR })
    }

}

module.exports = {
    placeOrder,
    razerpayorder,
    verifyPayment,
    cancel,
    OrderrReturn
    
};


