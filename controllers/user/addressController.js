
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const product = require("../../models/productModel");
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");



const loadAddress = async (req, res) => {
    try {
        if (!req.session.user || !req.session.userData) {
            return res.redirect("/login");
        }
        const sessionUserId = req.session.userData._id;
        const { userId } = req.params;
        if (userId !== sessionUserId.toString()) {
            return res.redirect("/404");
        }
        const user = await userSchema.findById(sessionUserId);
        if (!user) {
            return res.redirect("/404");
        }
        const address = user.addresses;
        res.render("address", { address: address, userId });
    } catch (error) {
        console.error(error);
        res.redirect("/error");
    }
};
const loadCreateAddress = async (req, res) => {
    try {
        const { userId } = req.params
        res.render("addAddress", { userId })
    } catch (error) {
        console.log(error)
        res.redirect("/404")
    }
}
const CreateAddress = async (req, res) => {
    try {
        if (!req.session.user || !req.session.userData) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.UNAUTHORIZED });
        }
        const sessionUserId = req.session.userData._id;
        const { userId } = req.params;
        if (userId !== sessionUserId.toString()) {
            return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, message: MESSAGES.FORBIDDEN });
        }

        const user = await userSchema.findById(sessionUserId);
        if (!user) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
        }

        const { address, city, state, name, pincode, phone } = req.body;

        user.addresses.push({
            address: address,
            city: city,
            state: state,
            name: name,
            pincode: pincode,
            phone: phone
        });
       
        await user.save();

        res.status(STATUS_CODES.OK).json({ success: true, message: "Success" });
        
    } catch (error) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
    }
}
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userData._id
        const { addressId } = req.params;
        const user = await userSchema.findById(userId)
        
        const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);

        if (addressIndex === -1) {
          return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ADDRESS_NOT_FOUND });
        }
    
        user.addresses.splice(addressIndex, 1);
        await user.save();

       return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADDRESS_DELETED_SUCCESS });
    } catch (error) {
        console.error(error);
       return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
    }
};

const loadAddressEdit = async (req, res) => {
    try {
                const {addressId} = req.params
                console.log(req.session.userData)
                const userId = req.session.userData._id
                const user = await userSchema.findById(userId)
                const address = user.addresses.find((addr) => addr._id.toString() === addressId);
              
             console.log(user)
              
        if(!req.session.user){
            return res.redirect("/login")
        }

      
console.log(req.session.userData)
        res.render("editAddress",{
            userId: req.session.userData._id,
            address: address
        })
        
        


        
    } catch (error) {
        
    }






}

const editAddress = async (req, res) => {
    try {
        const { addressId } = req.params; 
        console.log(" address id  first"+addressId  )
        const { name, address, city, state, pincode, phone } = req.body; 
        console.log(name, address, city, state, pincode, phone)

        const user = await userSchema.findById(req.session.userData._id); 
        
        if (!user) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ message: MESSAGES.USER_NOT_FOUND });
        }

        const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId.toString());

        if(addressIndex === -1) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ message: MESSAGES.ADDRESS_NOT_FOUND });
        }
        
        user.addresses[addressIndex].name = name;
        user.addresses[addressIndex].address = address;
        user.addresses[addressIndex].city = city;
        user.addresses[addressIndex].state = state;
        user.addresses[addressIndex].pincode = pincode;
        user.addresses[addressIndex].phone = phone;

        await user.save();

        return res.status(STATUS_CODES.OK).json({ message: MESSAGES.ADDRESS_UPDATED_SUCCESS });

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.ADDRESS_UPDATE_ERROR });
    }
};





module.exports = {
    loadCreateAddress,
    loadAddress,
    CreateAddress,
    deleteAddress,
    loadAddressEdit,
    editAddress
}


