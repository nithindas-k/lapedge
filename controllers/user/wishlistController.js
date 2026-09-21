
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const wishlist = require("../../models/wishlistModel")
const cart = require("../../models/cartModel")
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");



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
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.PRODUCT_NOT_FOUND });
    }

    let userWishlist = await wishlist.findOne({ userId });
    if (!userWishlist) {
      userWishlist = new wishlist({ userId: userId, items: [] });
    }


    const isItemExist = userWishlist.items.some((x) => x.toString() === productId);
    if (isItemExist) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.ITEM_ALREADY_IN_WISHLIST });
    }


    userWishlist.items.push(product._id);
    await userWishlist.save();

    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_ADDED_TO_WISHLIST });

  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const addToCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userData._id;

  try {
    const product = await productSchema.findById(productId);
    if (!product) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_NOT_FOUND });
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
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_NOT_IN_WISHLIST });
    }



    if (productInCart) {
      if (productInCart.quantity + parseInt(quantity) > product.quantity) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_ALREADY_IN_CART });
      }
      
      
      if(productInCart.quantity == 5){
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_ALREADY_IN_CART_SPACE })
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


    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_ADDED_SUCCESS })









  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
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
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.WISHLIST_NOT_FOUND });
    }

    const wishlistProduct = wishlist.items.find(item => item.equals(productId));
    if (!wishlistProduct) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.PRODUCT_NOT_IN_WISHLIST });
    }


    wishlist.items = wishlist.items.filter(item => !item.equals(productId));
    await wishlist.save();

    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_DELETED_SUCCESS });
  } catch (error) {
    console.error("Error in deleteWishlist:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};



module.exports = {
  loadWishlist,
  addWishlist,
  addToCart,
  deleteWishlist


}