const express = require("express");
const app = express()
const path = require("path")
require("dotenv").config()
const db = require("./config/db");
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")
const categoryRoutes = require("./routes/categoryRoutes")
const productRouter = require("./routes/productRouter")
const session = require("express-session")
const passport =require("./config/passport")
const nocache =require("nocache")
const variantRoutes = require("./routes/variantRouter")
const addressRouters = require("./routes/addressRouters")
const cartRoutes  = require("./routes/cartRouter")
const checkoutRoutes = require("./routes/checkoutRoutes")
const orderRoutes = require("./routes/orderRouter")
const wishlistRoutes = require("./routes/wishlistRouter")
const couponRoutes  = require("./routes/couponRouters")
const offerRoutes  = require("./routes/offerRoutes")
const walletRoutes = require("./routes/walletRouter")
db()


const userLog = require('./middleware/userLoginCheck')
const userAuth = require('./middleware/userAuth')


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
   

}))
  
app.use((req, res, next) => {
    
    next();
});

app.use(nocache())

app.use(userLog)




app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize())
app.use(passport.session())



app.set("views", [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin') ,path.join(__dirname, 'views/partials')]);
app.set('view engine', 'ejs');



app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/category", categoryRoutes);
app.use("/products", productRouter);
app.use("/variants",variantRoutes)
app.use("/address",addressRouters);
app.use("/cart",cartRoutes)
app.use("/checkout", checkoutRoutes)
app.use("/order", orderRoutes)
app.use("/wishlist",wishlistRoutes)
app.use("/coupon", couponRoutes)
app.use("/offer", offerRoutes)
app.use("/wallet",walletRoutes)







app.listen(process.env.PORT, () => {
    console.log("server is running")
})

