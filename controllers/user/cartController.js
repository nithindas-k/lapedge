const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");

const cart = require("../../models/cartModel")





const loadCart = async (req, res) => {
  try {



    const userId = req.session.userData._id;

    const userCart = await cart.findOne({ user: userId })
      .populate('items.productId');

    if (!userCart || userCart.items.length === 0) {
      return res.render("cart", {
        items: [],
        totalQuantity: 0,
        totalAmount: 0
      });
    }

    const totalQuantity = userCart.items.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = userCart.items.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);


    res.render("cart", {
      items: userCart.items,
      totalQuantity,
      totalAmount
    });

  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.CART_LOAD_ERROR);
  }
};



const addCart = async (req, res) => {
  const { productId, quantity } = req.body
  try {


    const userId = req.session.userData._id

    const product = await productSchema.findById(productId)    

    if (!product) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_NOT_FOUND })
    }

    let userCart = await cart.findOne({ user: userId })

    if (!userCart) {
      userCart = new cart({ user: userId })
    }

    let productInCart = userCart.items.find(p => p.productId.toString() === productId);

    if (productInCart) {
      if (productInCart.quantity + parseInt(quantity) > product.quantity) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.STOCK_LIMIT_EXCEEDED })

      }
      if (productInCart.quantity + parseInt(quantity) > 5) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.LIMIT_EXCEEDED })
      }

      productInCart.quantity += parseInt(quantity);
      userCart.totalQuantity += parseInt(quantity);
      userCart.totalAmount += parseInt(quantity) * product.salePrice;
      await userCart.save();
    } else {

      userCart.items.push({ productId: productId, quantity: quantity });
      userCart.totalQuantity += parseInt(quantity);
      userCart.totalAmount += parseInt(quantity) * product.salePrice;
      await userCart.save();
    }

    await userCart.save()
    res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_ADDED_TO_CART })








  } catch (error) {

    console.log(error)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR });
  }


}

const deleteCart = async (req, res) => {
  try {

    const { itemId } = req.body
    const userId = req.session.userData._id
    const userCart = await cart.findOne({ user: userId })
    if (!userCart) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.CART_NOT_FOUND });
    }
    const itemIndex = userCart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ITEM_NOT_FOUND_IN_CART });
    }
    userCart.items.splice(itemIndex, 1);
    await userCart.save();
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ITEM_REMOVED_FROM_CART });





  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR });
  }


}

const updateQuantity = async (req, res) => {
  const { itemId, newQuantity, totalAmount } = req.body;

  try {

    let userCart = await cart.findOne({ user: req.session.userData._id }).populate("items.productId")

    if (!userCart) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.CART_NOT_FOUND });
    }


    const item = userCart.items.find((item) => item._id.toString() === itemId)



    if (!item) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ITEM_NOT_FOUND_IN_CART });
    }

    if (parseInt(newQuantity) > 5) {
      
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.MAX_LIMIT_5 })

    }

    if (parseInt(newQuantity) > item.productId.quantity) {
      
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.STOCK_LIMIT_EXCEEDED })

    }


    item.quantity = parseInt(newQuantity);

    userCart.totalQuantity = userCart.items.reduce((total, i) => total + i.quantity, 0);
    userCart.totalAmount = userCart.items.reduce((total, i) => total + (i.productId.salePrice * i.quantity), 0);

    await userCart.save();


    res.status(STATUS_CODES.OK).json({
      success: true,
      userCart,
      message: "Quantity updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.FAILED_TO_UPDATE_CART });
  }


}

module.exports = {
  loadCart,
  addCart,
  deleteCart,
  updateQuantity

}