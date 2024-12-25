
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const product = require("../../models/productModel");
const User = require("../../models/userSchema")
const wishlist = require("../../models/wishlistModel")
const couponSchema = require("../../models/couponModel")
const offerSchema   = require("../../models/offerModel")
const Wallet = require("../../models/wallet")
const Transaction = require("../../models/waletTrancations")

const Order = require("../../models/orderModel")

const loadWalletPage = async (req , res )=>{

    try {
        if(!req.session.user){
            res.redirect("/login")
            
        }

        const userId = req.session.userData._id
        const wallet  = await Wallet.findOne({userId:userId})
        const transaction  =  await Transaction.find({userId:userId}).sort({date:-1})

        console.log(transaction)
        res.render("wallet",{
            wallet: wallet,
            transaction: transaction
        })
        
    } catch (error) {
        console.log(error)
        
    }

}




module.exports = {
    loadWalletPage

}