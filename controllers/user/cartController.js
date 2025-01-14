const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');

const cart = require("../../models/cartModel")





const loadCart = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect("/login");
    }

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
    res.status(500).send("An error occurred while loading the cart.");
  }
};



const addCart = async (req, res) => {
  const { productId, quantity } = req.body
  try {

    if (!req.session.user) {
      return res.status(404).json({ success: false, message: "user not found" })

    }
    userId = req.session.userData._id

    const product = await productSchema.findById(productId)    

    if (!product) {
      return res.status(400).json({ success: false, message: "Product not found" })
    }

    let userCart = await cart.findOne({ user: userId })

    if (!userCart) {
      userCart = new cart({ user: userId })
    }

    let productInCart = userCart.items.find(p => p.productId.toString() === productId);

    if (productInCart) {
      if (productInCart.quantity + parseInt(quantity) > product.quantity) {
        return res.status(400).json({ success: false, message: "Stock  Limit is exceeded" })

      }
      if(productInCart.quantity == 5){
        return res.status(400).json({ success: false, message: " Limit is exceeded" })
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
    res.status(200).json({ success: true, message: "Product added to cart" })








  } catch (error) {

    console.log(error)
  }


}

const deleteCart = async (req, res) => {
  try {

    const { itemId } = req.body
    const userId = req.session.userData._id
    const userCart = await cart.findOne({ user: userId })
    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    const itemIndex = userCart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }
    userCart.items.splice(itemIndex, 1);
    await userCart.save();
    return res.status(200).json({ success: true, message: "Item removed from cart" });





  } catch (error) {
    console.log(error)
  }


}

const updateQuantity = async (req, res) => {
  const { itemId, newQuantity, totalAmount } = req.body;

  try {

    let userCart = await cart.findOne({ user: req.session.userData._id }).populate("items.productId")

    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }


    const item = userCart.items.find((item) => item._id.toString() === itemId)



    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    if (parseInt(newQuantity) > 5) {
      
      return res.status(400).json({ success: false, message: "Max  Limit is 5" })

    }

    if (parseInt(newQuantity) > item.productId.quantity) {
      
      return res.status(400).json({ success: false, message: "Stock  Limit is exceeded" })

    }


    item.quantity = newQuantity;

    
    console.log("userCart.totalQuantity" + userCart.totalQuantity)
    userCart.totalQuantity = newQuantity - userCart.totalQuantity
    console.log(userCart.totalQuantity)
    userCart.totalAmount = totalAmount;


    await userCart.save();


    res.status(200).json({
      success: true,
      cart,
      message: "Quantity updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }


}

module.exports = {
  loadCart,
  addCart,
  deleteCart,
  updateQuantity

}