const userSchema = require("../../models/userSchema")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Variant = require("../../models/variantModel")

const productSchema = require("../../models/productModel")

const loadLogin = (req, res) => {

    if (req.session.isAd) {
        return res.redirect("/admin/dashboard")
    }
    res.render('adminLogin', { message: null })
}
const error = async (req, res) => {
    res.render("error")

}


const login = async (req, res) => {
    const { email, password } = req.body;
   console.log(password)
    try {
        // email exists 
        const user = await userSchema.findOne({ email: email, isAdmin: true });

        if (!user) {
            //  is not an admin
            return res.render("adminLogin", { message: "Invalid email or password.", messageType: "error" });
        }


        const passwordMatch = await bcrypt.compare(password, user.password);
            console.log(passwordMatch)
        if (!passwordMatch) {
            return res.render("adminLogin", { message: "Invalid  password.", messageType: "error" });
        }
        req.session.isAdmin = true;

        //   req.session.user = user;
        return res.redirect("/admin/dashboard");

    } catch (error) {
        console.error("Login error: ", error);
        res.render("adminLogin", { message: "An error occurred. Please try again later." });
    }
};

const loadDashboard = async (req, res) => {
  
        try {
            res.render("Dashboard");
        } catch (error) {
            res.redirect("/pageerror");
        }
    } 


const loadAllProducts = async (req, res) => {
    try {
        //search the product
        const searchQuery = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const pageSize = 5;
        const skip = (currentPage - 1) * pageSize;


        const searchFilter = {
            name: { $regex: searchQuery, $options: 'i' },
        };


        const products = await productSchema.find(searchFilter).skip(skip).limit(pageSize).populate("category")

        // filter  products count 
        const totalProducts = await productSchema.countDocuments(searchFilter);
        const totalPages = Math.ceil(totalProducts / pageSize);


        res.render('products', {
            products: products,
            currentPage: currentPage,
            totalPages: totalPages,
            searchQuery: searchQuery,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error loading products',
            error: error.message,
        });
    }
};
const ToggleProductBlock = async (req, res) => {
    try {
        const productId = req.params.id;


        const product = await productSchema.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Toggle the product's isBlocked status
        product.isBlocked = !product.isBlocked;
        await product.save(); // Save the updated product status

        const statusMessage = product.isBlocked ? "Product unlisted successfully!" : "Product listed successfully!";

        return res.status(200).json({
            success: true,
            message: statusMessage
        });

    } catch (error) {
        console.error("Error in ToggleProductBlock:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error, please try again."
        });
    }
};

const  LoadVariantManagement= async(req, res)=>{
    try {
        // Fetch variants for each category
        const ramVariants = await Variant.find({ category: 'ram' });
        const processorVariants = await Variant.find({ category: 'processor' });
        const displayVariants = await Variant.find({ category: 'display' });
        const storageVariants = await Variant.find({ category: 'storage' });

        // Render the view with variants
        res.render('variantmanagement', {
            ramVariants,
            processorVariants,
            displayVariants,
            storageVariants
        });
    } catch (error) {
        console.error('Error loading variant management:', error);
        res.status(500).send('Error loading variant management page');
    }
}
    



module.exports = {
    loadLogin,
    login,
    loadDashboard,
    error,
    loadAllProducts,
    ToggleProductBlock,
    LoadVariantManagement
}