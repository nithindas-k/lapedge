
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
const path = require('path');
console.log('Email:', env.NODEMAILER_EMAIL);
console.log('Password exists:', !!env.NODEMAILER_PASSWORD);



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
        res.status(200).redirect("/404")
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
        req.session.userData = { name, email, password, };
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
        console.log(userOtpInput, sessionOtp, req.session.userData)
        if (userOtpInput === sessionOtp) {

            const { name, email, password } = req.session.userData;


            const hashedPassword = await bcrypt.hash(password, 10);


            const newUser = new userSchema({
                name,
                email,
                password: hashedPassword
            });


            await newUser.save();


            req.session.UserOtp = null;
            req.session.userData = newUser;
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
        req.session.userData = user;
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
        //  const userData = req.session.userData;


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
        if(!product){
            return res.redirect("/404")
        }
        const products = await productSchema.find({ _id: { $ne: id }, isBlocked: false, name: { $eq: product.name } }).populate("category")

        return res.render("productDetails", { product: product, products: products, wishlisted: wishlisted })

    } catch (error) {
        console.log("productDetails page not founded", error)
        res.status(200).redirect("/404")
    }

}

const loadAccount = async (req, res) => {
    try {

        if (!req.params.userId) {
            return res.redirect("/login")
        }
        const userId = req.session.userData._id
        const user = await userSchema.findById(userId)
        if(!user){
            return res.redirect("/404")
        }


        res.render("account", {
            user: user
        })
    } catch (error) {
        res.redirect("/404")    

    }


}




const loadOrders = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }
        const userId = req.session.userData._id
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 }).populate("items.ProductId")
        if(!orders){
            return res.redirect("/404")
        }
        





        res.render("order", {
            orders: orders
        })


    } catch (error) {
        console.log(error)

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
        if(!orderDetails){
            return res.redirect("/404")
        }

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
        res.redirect("/404")


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


        const userId = req.session.userData._id
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


const loadOrderFailure = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }

        const { razorpayId } = req.params
        console.log("-------------------------------------", razorpayId)






        const orderDetails = await Order.findOne({ razorpayOrderId: razorpayId }).populate("items.ProductId")
        const totalAmount = orderDetails?.items.reduce((accumulator, item) => {
            return accumulator + item.totalPrice;
        }, 0);
        const couponId = orderDetails?.coupon

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

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.params

        const order = await Order.findById(orderId).populate("userId")
        console.log(order)
        const oldOrderId = order.razorpayOrderId

        const user = await userSchema.findOne({ _id: order.userId })






        let amountInPaise = Math.round(parseFloat(order.totalAmount) * 100);

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

        console.log("++++++++++++++++++++++++++++++++++++", razorpayOrder)



        const response = {
            success: true,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            amount: amountInPaise,
            orderId: razorpayOrder.id,
            order_id: orderId,

            prefill: {
                name: user.name || '',
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

        const order = await Order.findById(orderId)
            .populate('userId', 'name email address phone')
            .populate('items.ProductId', 'name salePrice');

        if (!order) {
            return res.status(404).send('Order not found');
        }

    
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });

        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}.pdf"`);


        doc.pipe(res);

        
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height; 
        const imageWidth = 500;           
        const imageHeight = 150;         
        const centerX = (pageWidth - imageWidth) / 2; 
        const centerY = (pageHeight - imageHeight) / 2; 

        
        doc.save(); 
        doc.fillOpacity(0.2) 
            .image(path.join(__dirname, '../../public/images/mainlogo.png'), centerX, centerY, { width: imageWidth });
        doc.restore(); 



        
        doc.font('Helvetica-Bold')
            .fontSize(25)
            .text('INVOICE', 50, 50, { align: 'right' });

        
        doc.font('Helvetica')
            .fontSize(10)
            .text('lapedge', 50, 85)
            .text('malappuram', 50, 100)
            .text('malappuram, kerala, india', 50, 115)
            .text('Phone:8921642524', 50, 130)
            .text('Email: lapedge@gmail.com', 50, 145);


        doc.strokeColor('#00000')
            .lineWidth(1)
            .moveTo(50, 170)
            .lineTo(550, 170)
            .stroke();


        doc.fontSize(12)
            .text('Invoice Number:', 50, 190)
            .text(`INV-${order._id.toString().slice(-6)}`, 150, 190)
            .text('Date:', 50, 205)
            .text(new Date(order.createdAt).toLocaleDateString(), 150, 205)
            .text('Order ID:', 50, 220, { fontSize: 1 })

            .text(order._id.toString(), 150, 220);


        doc.fontSize(14)
            .text('Bill To:', 300, 190)
            .fontSize(12)
            .text(order.userId.name, 300, 205)
            .text(order.userId.email, 300, 220)
            .text(order.shippingAddress, 300, 235, {
                width: 250,
                leading: 5
            });


        let y = 300;
        const tableTop = y;
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text('Item', 50, y, { width: 190 })
            .text('Quantity', 250, y, { width: 90, align: 'center' })
            .text('Unit Price', 340, y, { width: 90, align: 'right' })
            .text('Total', 430, y, { width: 90, align: 'right' });

        y += 20;
        doc.strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();


        doc.font('Helvetica');
        order.items.forEach(item => {
            y += 20;


            if ((y - tableTop) / 20 % 2 === 0) {
                doc.fillColor('#f6f6f6')
                    .rect(50, y - 10, 500, 20)
                    .fill()
                    .fillColor('#000000');
            }

            doc.text(item.ProductId.name, 50, y, { width: 190 })
                .text(item.quantity.toString(), 250, y, { width: 90, align: 'center' })
                .text(`${item.unitPrice.toFixed(2)}`, 340, y, { width: 90, align: 'right' })
                .text(`${item.totalPrice.toFixed(2)}`, 430, y, { width: 90, align: 'right' });
        });


        y += 40;
        doc.strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();

        y += 20;
        doc.font('Helvetica-Bold')
            .text('Subtotal:', 350, y, { width: 90, align: 'right' })
            .text(`${order.totalAmount.toFixed(2)}`, 430, y, { width: 90, align: 'right' });

        y += 20;
        doc.text('Discount:', 350, y, { width: 90, align: 'right' })
            .text(`${order.couponDiscount.toFixed(2)}`, 430, y, { width: 90, align: 'right' });

        y += 20;
        doc.fontSize(12)
            .text('Total Amount:', 350, y, { width: 90, align: 'right' })
            .text(`${order.payableAmount.toFixed(2)}`, 430, y, { width: 90, align: 'right' });


        y += 40;
        doc.fontSize(10)
            .text('Payment Details', 50, y)
            .font('Helvetica')
            .fontSize(10)
            .text(`Payment Method: ${order.paymentMethod}`, 50, y + 15)
            .text(`Payment Status: ${order.paymentStatus}`, 50, y + 30);

        doc.fontSize(10)
            .text('Thank you for your business!', 50, 700, { align: 'center' })
            .moveDown()
            .fontSize(8)
            .text('For any queries, please contact our customer support.', { align: 'center' })
            .moveDown()
            .text('This is a computer-generated document and does not require a signature.', { align: 'center', color: '#666666' });

        // Add page numbers
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
                .text(`Page ${i + 1} of ${pageCount}`, 50, 750, { align: 'center' });
        }


        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice: ' + error.message);
    }
};

const errorpage = async (req,res)=>{
    try {
        res.render("404")
        
    } catch (error) {
        
    }
}



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
    loadInvoice,
    errorpage



}
