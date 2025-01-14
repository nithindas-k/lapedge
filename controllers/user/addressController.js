
const userSchema = require("../../models/userSchema")
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require('bcrypt');
const product = require("../../models/productModel");



const loadAddress = async (req, res) => {
    const {userId}  = req.params
    const user = await userSchema.findById(userId)
    if(!user){
        return res.redirect("/404")
    }





    try {
        res.render("address",{
            addresses:user.addresses,
            user: user
        })
        
    } catch (error) {
        res.redirect("/404")
        
    }``
}
const loadCreateAddress = async (req, res) => {
    const id =  req.query.id
 
    
    
   

    try {

        if(!req.session.user){
            return res.redirect("/login")
        }
          console.log("+++++++++++++++++++")
console.log(req.session.userData)
        res.render("addAddress",{
            userId: req.session.userData._id,
            check:id,

        })
        

        
    
        
        
    } catch (error) {
        
             res.redirect("/404")
        
        
        
    }


}
const CreateAddress = async (req, res) => {
    try {

        const{userId}  = req.params
       
        const user = await userSchema.findById(userId);

        const { address, city, state, name,pincode,phone } = req.body;

        user.addresses.push({
            address: address,
            city: city,
            state: state,
            name: name,
            pincode: pincode,
            phone: phone
        })
       
        await user.save();

     res.json({success: true, message:"Success"})
        
    } catch (error) {
        
    }


}
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userData._id
        const { addressId } = req.params;
        const user = await userSchema.findById(userId)
        
        const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);

        if (addressIndex === -1) {
          return res.status(404).json({ success: false, message: "Address not found" });
        }
    
        user.addresses.splice(addressIndex, 1);
        await user.save();

       return res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        console.error(error);
       return res.status(500).json({ success: false, message: "Something went wrong" });
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
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId.toString());

        if(addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }
        
        user.addresses[addressIndex].name = name;
        user.addresses[addressIndex].address = address;
        user.addresses[addressIndex].city = city;
        user.addresses[addressIndex].state = state;
        user.addresses[addressIndex].pincode = pincode;
        user.addresses[addressIndex].phone = phone;

        await user.save();

        return res.status(200).json({ message: 'Address updated Successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating address' });
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


