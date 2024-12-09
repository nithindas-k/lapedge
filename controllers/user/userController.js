
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const product = require("../../models/productModel");

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
        console.log("user in put "+userOtpInput)
       
        const sessionOtp = req.session.UserOtp;
        const sessionOtpTimestamp = req.session.UserOtpTimestamp;
       console.log(sessionOtp,sessionOtpTimestamp)
        
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
            console.log("+++++++++++"+req.session.userData)
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
        }

        // otp check
        console.log(userOtpInput,sessionOtp,req.session.UserData)
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
            req.session.UserData = null;
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
        const userData = req.session.UserData;  

     
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
        const products = await productSchema.find({isBlocked:false}).populate("category").populate("specifications.RAM").populate("specifications.processor").populate("specifications.displaySize").populate("specifications.storage")

        console.log(products)
        res.render("shop",{products})

    } catch (error) {
        console.log(error)
    }

}





const loadHomepage = async (req, res) => {
    const category = await categorySchema.find({isListed: true})

    const products = await productSchema.find({isBlocked: false}).populate("category")
    const userLoggedIn = !!req.session.user;


    try {
        return res.render("home",{category:category,product:products,userLoggedIn:userLoggedIn})

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
        req.session.user=true
      
        res.redirect("/")



    } catch (error) {
        console.log("login error", error)
        res.render("login", { message: " login faild  try again later" })
    }

}

const loadproductDetails = async (req, res) => {
    const id = req.params.id;
    try {
        
        const product = await productSchema.findOne({_id:id}) .populate('specifications.RAM').populate('specifications.processor').populate('specifications.displaySize').populate('specifications.storage');
        const products = await productSchema.find({isBlocked:false,category: product.category,_id:{$ne:id}}).populate("category")
        console.log(product)
        return res.render("productDetails",{product: product,products:products})

    } catch (error) {
        console.log("productDetails page not founded", error)
        res.status(200).send("server error")
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
    loadproductDetails


}
