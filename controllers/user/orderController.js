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
            return res.status(400).json({
                success: false,
                message: 'Address and payment method are required',
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty',
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
            return res.status(404).json({success:false,message:"COD Not available on this product"})
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
            orderStatus: 'Ordered',
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Success',
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

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            newOrder,
        });
    } catch (error) {
        console.error('Order Placement Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place order',
            error: error.message
        });
    }
};

const razerpayorder = async (req, res) => {
    try {
        
        const userId = req.session.userData._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { addressId, paymentMethod, payableAmount, couponCode } = req.body;
        
        if (!addressId || !paymentMethod || !payableAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        console.log("++++++++++++++++++++++++++++++++++++++++15")
        const coupon = await Coupon.findOne({code: couponCode})
        console.log("++++++++++++++++++++++++++++++++++++++++"+coupon)

        
        
   
        const amountInPaise = Math.round(parseFloat(payableAmount) * 100);
       

      
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        const orderItems = cart.items.map((item) => ({
            ProductId: item.productId._id,
            quantity: item.quantity,
            unitPrice: item.productId.salePrice,
            totalPrice: item.quantity * item.productId.salePrice,
        }));
        let totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);
        let couponDiscount = totalAmount - payableAmount

        
        const shippingAddress = user.addresses.find(
            (addr) => addr._id.toString() === addressId
        );
        if (!shippingAddress) {
            return res.status(400).json({
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
            orderStatus: 'Pending',
            paymentStatus: 'Pending',
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
       
        return res.status(200).json(response);

    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return res.status(500).json({
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
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        console.log("2")
        console.log(razorpay_order_id)

        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

        console.log(order)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log("3")
        order.paymentStatus = 'Success';
        order.orderStatus = 'Ordered';
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
        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            orderId: order._id
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment verification failed',
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
                order.items[i].status = "Cancelled"
                order.items[i].reason = cancelReason || null
                const product  = await Product.findById(orderItemId)
                product.quantity += order.items[i].quantity
               
                let qstatus = ""
                if (quantity == 0) {
                    qstatus = "Out Of Stock"
                } else if (quantity > 5) {
                    qstatus = "Available"
                } else if (quantity <= 5) {
        
                    qstatus = "Hurry up!"
                }
                product.status = qstatus
        
                await product.save()


                if(order.paymentStatus == "Success"){
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
                    const remainingDiscount = totalOrderDiscount - proptionalDiscount
                    let newPayableAmount =0
                    for(let item of order.items){
                       if(item.status !== 'Cancelled'){
                         newPayableAmount += item.totalPrice
                       }
                    }
                    order.payableAmount = newPayableAmount
                    order.coupon=null

                }
                break;
            }
        }
        const itemStatuses = order.items.map(item => item.status)
        const isAllItemsCancelled = itemStatuses.every((status) => status == "Cancelled")
        if (isAllItemsCancelled) {
            order.orderStatus = "Cancelled"
            order.cancellationReason = "All Items Are Cancelled"
        }
        await order.save()
        res.status(200).json({ success: true, isAllItemsCancelled })

    } catch (error) {
        console.log(error)
    }
}
 

const OrderrReturn =  async (req , res) => {
    try {
        const {orderItemId , orderId,returnReason}=req.body
        const order =  await Order.findById(orderId)
        const item = order.items.find(item => item.ProductId.toString() == orderItemId)
        if(!item) return res.status(404).json({ success: false, message: 'Item not found' })
            item.status = "Return Requested"
            item.reason = returnReason || null
            await order.save()
        
            
        res.status(200).json({ success: true, message: 'Item returned successfully' })

        
    } catch (error) {
        
    }

}

module.exports = {
    placeOrder,
    razerpayorder,
    verifyPayment,
    cancel,
    OrderrReturn
    
};


