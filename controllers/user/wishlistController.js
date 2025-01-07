
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const wishlist = require("../../models/wishlistModel")
const cart = require("../../models/cartModel")



const Order = require("../../models/orderModel")
const Wishlist = require("../../models/wishlistModel")



const loadWishlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login")
    }
    const userId = req.session.userData._id

    let userWishlist = await wishlist.findOne({ userId }).populate("items")
    console.log(userWishlist)
  
    res.render("wishlist", {
      userWishlist: userWishlist
    })
  } catch (error) {

    console.error(error)
  }
}

const addWishlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const { productId } = req.body;

    const userId = req.session.userData._id;


    const product = await productSchema.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let userWishlist = await wishlist.findOne({ userId });
    if (!userWishlist) {
      userWishlist = new wishlist({ userId: userId, items: [] });
    }


    const isItemExist = userWishlist.items.some((x) => x.toString() === productId);
    if (isItemExist) {
      return res.status(400).json({ success: false, message: "Item is already in your wishlist" });
    }


    userWishlist.items.push(product._id);
    await userWishlist.save();

    return res.status(200).json({ success: true, message: "Product added to wishlist" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addToCart = async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login")

  }
  const { productId, userId } = req.body;

  try {

    if (!req.session.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    const product = await productSchema.findById(productId);
    if (!product) {
      return res.status(400).json({ success: false, message: "Product not found" });
    }

    const quantity = 1;

    let userCart = await cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new cart({ user: userId });
    }

    let productInCart = userCart.items.find(p => p.productId.toString() === productId);

    const wishlist = await Wishlist.findOne({ userId })
    const wishlistProduct = wishlist.items.find(item => item._id == productId)
    if (!wishlistProduct) {
      return res.status(400).json({ success: false, message: "Product not found in wishlist" });
    }



    if (productInCart) {
      if (productInCart.quantity + parseInt(quantity) > product.quantity) {
        return res.status(400).json({ success: false, message: "Stock limit exceeded" });
      }

      productInCart.quantity += parseInt(quantity);
      userCart.totalQuantity += parseInt(quantity);
      userCart.totalAmount += parseInt(quantity) * product.salePrice;
    } else {

      userCart.items.push({ productId: productId, quantity: quantity });
      userCart.totalQuantity += parseInt(quantity);
      userCart.totalAmount += parseInt(quantity) * product.salePrice;
    }


    await userCart.save();
    wishlist.items = wishlist.items.filter(item => item._id != productId)
    await wishlist.save()


    return res.status(200).json({ success: true, message: "product Added to successfully" })









  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const deleteWishlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const { productId } = req.params;
    const userId = req.session.userData._id;

    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    const wishlistProduct = wishlist.items.find(item => item.equals(productId));
    if (!wishlistProduct) {
      return res.status(404).json({ success: false, message: "Product not found in wishlist" });
    }


    wishlist.items = wishlist.items.filter(item => !item.equals(productId));
    await wishlist.save();

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteWishlist:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



module.exports = {
  loadWishlist,
  addWishlist,
  addToCart,
  deleteWishlist


}