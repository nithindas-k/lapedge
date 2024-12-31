
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const product = require("../../models/productModel");
const User = require("../../models/userSchema")
const wishlistSchema = require("../../models/wishlistModel")
const couponSchema = require("../../models/couponModel")
const offerSchema = require("../../models/offerModel")
const razorpay = require('../../config/razorpay');
const PDFDocument = require('pdfkit');



const Order = require("../../models/orderModel")




const pageNotFound = async (req, res) => {

    try {
        res.render('page-404')

    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


const loadSignup = async (req, res) => {

    try {
        res.render('signup', { message: null })

    } catch (error) {
        res.status.send("server error")

    }


}
const loadLoginPage = async (req, res) => {

    try {
        return res.render("login", { message: null })
    } catch (error) {

        console.log("login page not founded", error)
        res.status(200).send("server error")
    }


}


const loadverifyOtp = (req, res) => {
    console.log("loading")
    res.render('verify-otp')
}
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendVerificationEmail(email, otp) {
    try {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }, tls: {
                rejectUnauthorized: false
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "verify your email",
            text: `your OTP is ${otp}`,
            html: `<b>your OTP : ${otp}</b>`,
        })
        return info.accepted.length > 0
    } catch (error) {
        console.error("Error Sending email", error)
        return false

    }

}

const signup = async (req, res) => {
    try {
        const { name, email, password, cPassword } = req.body;
        console.log("Sending email")

        if (password !== cPassword) {
            return res.render("login", { message: "password invalid" });
        }

        //user already exists
        const findUser = await userSchema.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "email  already exists" });
        }

        //OTP
        const otp = generateOtp();

        // Otp sending to mail
        const emailSend = await sendVerificationEmail(email, otp);
        if (!emailSend) {
            return res.json({ message: "email.error" });
        }

        //saveing the otp 
        req.session.UserOtp = otp
        req.session.UserData = { name, email, password };
        req.session.email = email
        //OTP expiration  
        req.session.UserOtpTimestamp = Date.now();


        console.log("OTP SENT:", otp);
        console.log('Session Data:', req.session);


        res.redirect("/verifyotp");

    } catch (error) {
        console.error("Signup error:", error);
        res.redirect("/pageNotFound");
    }
};



const resendOTP = async (req, res) => {
    try {
        console.log('Resend OTP request received');
        console.log('Before Resend OTP:', req.session);
        const email = req.session.email;

        // OTP
        const newOtp = generateOtp();
        console.log("Generated new OTP", newOtp);

        //OTP expiration  
        req.session.UserOtpTimestamp = Date.now();
        const emailSent = await sendVerificationEmail(email, newOtp);
        if (!emailSent) {
            console.log("Failed to send email");
            return res.json({ success: false, message: "Failed to resend OTP. Please try again." });
        }

        // store otp 
        req.session.UserOtp = newOtp;

        console.log('After Resend OTP:', req.session);
        return res.json({ success: true, message: "OTP resent successfully", otp: newOtp });

    } catch (error) {
        console.error("Error in resending OTP", error);
        return res.json({ success: false, message: "Error resending OTP" });
    }
};

const verifyOtp = async (req, res) => {
    try {

        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const userOtpInput = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;
        console.log("user in put " + userOtpInput)

        const sessionOtp = req.session.UserOtp;
        const sessionOtpTimestamp = req.session.UserOtpTimestamp;
        console.log(sessionOtp, sessionOtpTimestamp)

        if (!sessionOtp) {
            return res.status(400).json({ success: false, message: "OTP not found. Please request a new OTP." });
        }

        // OTP has expired
        const otpExpirationTime = 1 * 60 * 1000;
        const currentTime = Date.now();
        console.log(currentTime - sessionOtpTimestamp > otpExpirationTime)
        if (currentTime - sessionOtpTimestamp > otpExpirationTime) {
            req.session.UserOtp = null;
            req.session.UserOtpTimestamp = null;
            console.log("+++++++++++" + req.session.userData)
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
        }

        // otp check
        console.log(userOtpInput, sessionOtp, req.session.UserData)
        if (userOtpInput === sessionOtp) {

            const { name, email, password } = req.session.UserData;


            const hashedPassword = await bcrypt.hash(password, 10);


            const newUser = new userSchema({
                name,
                email,
                password: hashedPassword
            });


            await newUser.save();


            req.session.UserOtp = null;
            req.session.UserData = newUser;
            req.session.UserOtpTimestamp = null;




            req.session.user = true;
            return res.json({ success: true, message: 'OTP verified successfully.' });


        } else {

            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while verifying OTP.' });
    }
};


const forgotOtp = async (req, res) => {
    try {
        const { email } = req.body;


        if (!email) {
            return res.json({ success: false, message: "Email is required." });
        }


        const user = await userSchema.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }


        const otp = generateOtp();


        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json({ success: false, message: "Failed to send OTP. Please try again." });
        }


        req.session.UserOtp = otp;
        req.session.UserData = user;
        console.log(`Forgot password otp: ${req.session.UserOtp}`)
        return res.json({ success: true, message: "OTP sent to your email ." });


    } catch (error) {
        console.error("Error in forgotOtp:", error);
        return res.json({ success: false, message: "An error occurred. Please try again." });
    }
};

const forgotOtpVerify = async (req, res) => {
    try {

        const { otp } = req.body;


        const sessionOtp = req.session.UserOtp;
        //  const userData = req.session.UserData;


        if (!sessionOtp) {

            return res.status(400).json({ success: false, message: "OTP not found. Please request a new OTP." });
        }


        if (otp === sessionOtp) {

            console.log("otp is correct")
            req.session.UserOtp = null;


            return res.status(400).json({ success: true });

        } else {


            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.log('Error verifying OTP for password reset:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while verifying OTP.' });
    }
};







const loadForgotOtpVerify = async (req, res) => {
    try {
        return res.render("forgotOtpverify")

    } catch (error) {
        console.log("forgotOtpverify page not founded", error)
        res.status(200).send("server error")
    }
}

const loadResetPassword = async (req, res) => {
    try {
        return res.render("forgotPassword")

    } catch (error) {
        console.log("forgotPassword page not founded", error)
        res.status(200).send("server error")
    }

}

const loadShopPage = async (req, res) => {
    try {


        const { category = "All", price = "All", sortBy = "All", page = 1, search = "" } = req.query;
        const limit = 8;
        const skip = (page - 1) * limit;

        let filter = {};

        if (category && category !== "All") {
            const selectedCategory = await categorySchema.findOne({ name: category });
            if (selectedCategory) {
                filter.category = selectedCategory._id;
            }
        }


        if (price && price !== "All") {
            const [min, max] = price.split("-").map(Number);
            filter.price = max ? { $gte: min, $lte: max } : { $gte: min };
        }


        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const products = await productSchema.find(filter)
            .populate("category")
            .sort(sortBy === "price-low-to-high" ? { price: 1 } :
                sortBy === "price-high-to-low" ? { price: -1 } :
                    { createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await productSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const categorys = await categorySchema.find({ isListed: true });


        res.render("shop", {
            products,
            category: categorys,
            selectedCategory: category,
            price,
            sortBy,
            currentPage: page,
            totalPages,
            searchQuery: search
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while loading the shop page.");
    }
};









const loadHomepage = async (req, res) => {
    const category = await categorySchema.find({ isListed: true })

    const products = await productSchema.find({ isBlocked: false }).populate("category")
    const userLoggedIn = !!req.session.user;


    try {
        return res.render("home", { category: category, product: products, userLoggedIn: userLoggedIn })

    } catch (error) {
        console.log("home page not founded", error)
        res.status(200).send("server error")
    }

}

const loadForgotPpassword = async (req, res) => {
    try {
        return res.render("Otprequest")
    } catch (error) {
        console.log("forgotOtp not founded", error)
        res.status(200).send("server error")
    }
}

const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        const findUser = await userSchema.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render("login", { message: "user not found" })
        }
        if (findUser.isBlocked) {
            return res.render("login", { message: "your account is blocked" })

        }

        const passwordMatch = await bcrypt.compare(password, findUser.password)
        if (!passwordMatch) {
            return res.render("login", { message: "password invalid" })
        }
        req.session.user = true
        req.session.userData = findUser

        res.redirect("/")



    } catch (error) {
        console.log("login error", error)
        res.render("login", { message: " login faild  try again later" })
    }

}

const loadproductDetails = async (req, res) => {
    const id = req.params.id;

    try {
        const userId = req?.session?.userData?._id
        let wishlisted = false
        if (userId) {
            const wishlist = await wishlistSchema.findOne({ userId: userId })
             wishlisted = wishlist && wishlist.items.includes(id)
        }
        


        const product = await productSchema.findOne({ _id: id }).populate('specifications.RAM').populate('specifications.processor').populate('specifications.displaySize').populate('specifications.storage');
        const products = await productSchema.find({ _id: { $ne: id }, isBlocked: false, name: { $eq: product.name } }).populate("category")

        return res.render("productDetails", { product: product, products: products, wishlisted: wishlisted })

    } catch (error) {
        console.log("productDetails page not founded", error)
        res.status(200).send("server error")
    }

}

const loadAccount = async (req, res) => {
    try {

        if (!req.params.userId) {
            return res.redirect("/login")
        }
        const userId = req.session.userData._id
        const user = await userSchema.findById(userId)


        res.render("account", {
            user: user
        })
    } catch (error) {

    }


}




const loadOrders = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }
        const userId = req.session.userData._id
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 })





        res.render("order", {
            orders: orders
        })


    } catch (error) {

    }



}





const loadProfileEdit = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect('/login');
        }


        const userId = req.session.userData._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect('/login');
        }

        res.render('updateprofile', {
            user: user,
            title: 'Edit Profile'
        });
    } catch (error) {
        console.error('Error loading profile edit page:', error);
        return res.status(500).render('error', {
            message: 'An error occurred while loading the profile page',
            error: error
        });
    }
};

const updateProfile = async (req, res) => {
    try {

        const { name, email } = req.body


        if (!req.session.user) {
            return res.redirect("login")
        }
        const userId = req.session.userData._id;
        const user = await userSchema.findById(userId);

        user.name = name


        user.save()
        return res.status(500).json({ success: true, message: "Profile updated successfully" })









    } catch (error) {
        console.error("Error in updating profile", error)
        return res.status(500).json({ success: false, message: "Failed to update profile" })

    }

};


const loadOrderConfirmation = async (req, res) => {
    try {
        const { orderId } = req.params




        const orderDetails = await Order.findById(orderId).populate("items.ProductId")
        const totalAmount = orderDetails.items.reduce((accumulator, item) => {
            return accumulator + item.totalPrice;
        }, 0);
        const couponId = orderDetails.coupon

        let discountAmonut = 0

        if (couponId) {
            const coupon = await couponSchema.findById(couponId)

            if (coupon && coupon.discountValue) {
                discountAmonut = parseInt((totalAmount * coupon.discountValue) / 100);
            }


        }

        if (!req.session.user) {
            return res.redirect("/login")
        }






        res.render("success", {
            order: orderDetails,
            totalAmount: totalAmount,
            discountAmonut: discountAmonut || 0
        })
    } catch (error) {


        console.log(error)

    }




}

const loadOrdersDetails = async (req, res) => {

    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }

        const { orderId } = req.params
        const orderDetails = await Order.findById(orderId)

        res.render("success", {
            orders: orderDetails
        })





    } catch (error) {

    }




}

const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body


        const userId = req.session.UserData._id
        const user = await userSchema.findById(userId)
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        if (user.password == hashedNewPassword) {
            return res.status(500).json({ success: false, message: "Password is same as old password" })

        }
        user.password = hashedNewPassword
        await user.save()
        res.status(200).json({ success: true, message: "Password updated successfully" })




    } catch (error) {
        console.log(error)

    }
}

const loadProductsFilter = async (req, res) => {
    try {
        const { sortBy, priceRange, category } = req.query
        console.log("filter data: +++++++++++++++++++++++++++++++++++++++++++++++ ", sortBy, priceRange, category)
        let sort = {}
        if (sortBy == "price-low-to-high") {
            sort = { salePrice: 1 }
        }

        if (sortBy == "price-high-to-low") {
            sort = { salePrice: -1 }
        }

        if (sortBy == "aA - zZ") {
            sort = { name: 1 }
        }
        if (sortBy == "zZ - aA") {
            sort = { name: -1 }

        }
        if (sortBy == "New arrivals") {
            sory = { createdAt: -1 }
        }


        //price 

        let find = {}
        if (priceRange == "50000-60000") {
            find = { salePrice: { $gte: 50000, $lte: 60000 } }
        }

        if (priceRange == "80000-100000") {
            find = { salePrice: { $gte: 80000, $lte: 100000 } }

        }

        if (priceRange == "100000") {

            find = { salePrice: { $gt: 100000 } }
        }
        if (priceRange == "60000-80000") {
            find = { salePrice: { $gte: 60000, $lte: 80000 } }

        }
        if (priceRange == "40000") {
            find = { salePrice: { $gte: 40000 } }
        }


        //category





        let products = await productSchema.find(find).sort(sort).populate("category")
        if (category != "All") {

            products = products.filter((product) => {

                return product.category.name.toString() == category

            })
        }


        res.json(products)





    } catch (error) {
        console.log(error)
    }




}


const loadOrderFailure  =  async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }

        const { razorpayId } = req.params
        console.log("-------------------------------------",razorpayId)

      




        const orderDetails = await Order.findOne({razorpayOrderId:razorpayId}).populate("items.ProductId")
        const totalAmount = orderDetails.items.reduce((accumulator, item) => {
            return accumulator + item.totalPrice;
        }, 0);
        const couponId = orderDetails.coupon

        let discountAmonut = 0

        if (couponId) {
            const coupon = await couponSchema.findById(couponId)

            if (coupon && coupon.discountValue) {
                discountAmonut = parseInt((totalAmount * coupon.discountValue) / 100);
            }


        }





        res.render("success", {
            order: orderDetails,
            totalAmount: totalAmount,
            discountAmonut: discountAmonut || 0
        })


        
    } catch (error) {
        console.log(error)
        
    }
}

const retryPayment =  async (req , res )=>{
    try {
        const {orderId} = req.params

        const order = await Order.findById(orderId).populate("userId")
        console.log(order)
        const oldOrderId = order.razorpayOrderId

       const user  = await userSchema.findOne({_id: order.userId})




        
             
        let amountInPaise  =  Math.round(parseFloat(order.totalAmount)*100);

        console.log(amountInPaise)


        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            payment_capture: 1
        };
           
            
            const razorpayOrder = await razorpay.orders.create(orderOptions);
            order.razorpayOrderId = razorpayOrder.id
            await order.save()

            console.log("++++++++++++++++++++++++++++++++++++",razorpayOrder)



            const response = {
                success: true,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
                amount: amountInPaise,
                orderId: razorpayOrder.id,
                order_id: orderId ,
                
                prefill: {
                    name:  user.name || '',
                    email: user.email || '',
                    contact: user.phone || ''
                }
            };

            return res.status(200).json(response);


    } catch (error) {

        console.log(error)
        
    }

}


const loadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Generating invoice for order:', orderId);

        // Fetch order with populated fields
        const order = await Order.findById(orderId)
            .populate('userId', 'name email address phone')
            .populate('items.ProductId', 'name salePrice');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Create PDF document
        const doc = new PDFDocument({
            margin: 30,
            size: 'A4',
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}.pdf"`);

        // Pipe the document to the response
        doc.pipe(res);

        // Helper function for drawing table rows
        const drawRow = (y, cols) => {
            cols.forEach(([text, xOffset, width]) => {
                doc.text(text, xOffset, y, { width, ellipsis: true });
            });
        };

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice Details
        doc.fontSize(12).text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Invoice Number: INV-${order._id.toString().slice(-6)}`);
        doc.text(`Order Status: ${order.orderStatus}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.moveDown();

        // Customer Details
        doc.fontSize(14).text('Customer Details', { underline: true });
        doc.fontSize(12).text(`Name: ${order.userId.name}`);
        doc.text(`Email: ${order.userId.email}`);
        doc.text(`Address: ${order.shippingAddress}`);
        doc.moveDown();

        // Items Table Header
        let y = doc.y + 10;
        doc.fontSize(14).text('Order Items', { underline: true });
        y += 20;

        doc.fontSize(12).text('Product', 30, y, { width: 200 });
        doc.text('Price', 250, y, { width: 100, align: 'right' });
        doc.text('Quantity', 350, y, { width: 100, align: 'right' });
        doc.text('Subtotal', 450, y, { width: 100, align: 'right' });
        doc.moveTo(30, y + 15).lineTo(550, y + 15).stroke();
        y += 20;

        // Items Table Rows
        order.items.forEach(item => {
            const productName = item.ProductId?.name || 'Unknown';
            const price = `₹${item.ProductId?.salePrice || 0}`;
            const quantity = item.quantity.toString();
            const subtotal = `₹${((item.ProductId?.salePrice || 0) * item.quantity).toFixed(2)}`;

            drawRow(y, [
                [productName, 30, 200],
                [price, 250, 100],
                [quantity, 350, 100],
                [subtotal, 450, 100],
            ]);
            y += 20;
        });

        doc.moveDown();

        // Payment Summary
        doc.fontSize(14).text('Payment Summary', { underline: true });
        doc.fontSize(12).text(`Subtotal: ₹${order.totalAmount.toFixed(2)}`);
        doc.text(`Discount: ₹${order.couponDiscount.toFixed(2)}`);
        doc.text(`Total Amount: ₹${order.payableAmount.toFixed(2)}`);
        doc.moveDown();

        // Footer
        doc.fontSize(10)
            .text('Thank you for your business!', { align: 'center' })
            .moveDown()
            .fontSize(8)
            .text('This is a computer-generated document and needs no signature.', { align: 'center' });

        // Finalize the PDF
        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice: ' + error.message);
    }
};



module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    loadLoginPage,
    login,
    resendOTP,
    verifyOtp,
    loadverifyOtp,
    loadForgotPpassword,
    forgotOtp,
    loadForgotOtpVerify,
    forgotOtpVerify,
    loadResetPassword,
    loadShopPage,
    loadproductDetails,
    loadAccount,
    loadProfileEdit,
    updateProfile,
    changePassword,
    loadOrderConfirmation,
    loadOrders,
    loadOrdersDetails,
    loadProductsFilter,
    loadOrderFailure,
    retryPayment,
    loadInvoice



}
