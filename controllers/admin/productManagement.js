const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const userSchema = require("../../models/userSchema")
const path = require('path');
const fs = require('fs');
const variantSchema = require("../../models/variantModel")


const { handleUpload } = require('../../config/cloud');

const LoadAddProduct = async (req, res) => {
    try {
        const ram = await variantSchema.find({ isBlocked: false, category: "ram" }).populate("category")
        const processor = await variantSchema.find({ isBlocked: false, category: "processor" }).populate("category")
        const display = await variantSchema.find({ isBlocked: false, category: "display" }).populate("category")
        const storage = await variantSchema.find({ isBlocked: false, category: "storage" }).populate("category")
        console.log(ram)      



        const category = await categorySchema.find({ isListed: true });   
        res.render('addProduct',
            { category: category, message: null, ram: ram, processor: processor, display: display, storage: storage })

    } catch (error) {
        res.redirect("/pageerror")
    }

}




const CreateProduct = async (req, res) => {
    try {
        const { name, description, brand, category, regularPrice, salePrice, quantity, RAM, processor, displaySize, storage } = req.body;

        let qstatus = "";

        if (quantity <= 5 && quantity > 0) {
            qstatus = "Hurry up!";
        } else if (quantity > 5) {
            qstatus = "Available";
        } else if (quantity === 0) {
            qstatus = "Out of Stock";
        }

        const images = [];
        const fileFields = ['productImage1', 'productImage2', 'productImage3'];

        
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const b64 = Buffer.from(req.files[i].buffer).toString("base64");
                let dataURI = "data:" + req.files[i].mimetype + ";base64," + b64;
                const cldRes = await handleUpload(dataURI)
                const path = cldRes.secure_url
                images.push(path)
            }
        }

    
        const newProduct = new productSchema({
            name,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            quantity,
            status: qstatus,
            specifications: {
                RAM,
                processor,
                displaySize,
                storage,
            },
            productImage: images
        });

        // Save the new product in the database
        await newProduct.save();

        const products = await productSchema.find();

        return res.status(200).json({
            message: 'Product created successfully!',
            product: newProduct,
            products: products
        });
    } catch (error) {   
        console.error(error);
        res.status(500).json({
            message: 'Error creating product',
            error: error.message,
        });
    }
};




const getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {

        const products = await productSchema.find().skip(skip).limit(limit).populate("category");
        console.log(products)

        const totalProducts = await productSchema.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', {
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
};

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.query.id;

        const product = await productSchema.findById(productId).populate("category").populate('specifications.RAM').populate('specifications.processor').populate('specifications.displaySize').populate('specifications.storage');
        res.render("adminProductDetails", { product: product })

    } catch (error) {

        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const LoadupdateProduct = async (req, res) => {

    try {

        const ram = await variantSchema.find({ isBlocked: false, category: "ram" }).populate("category")
        const processor = await variantSchema.find({ isBlocked: false, category: "processor" }).populate("category")
        const display = await variantSchema.find({ isBlocked: false, category: "display" }).populate("category")
        const storage = await variantSchema.find({ isBlocked: false, category: "storage" }).populate("category")
        const productId = req.params.Id
        const product = await productSchema.findById(productId).populate("category");
        const category = await categorySchema.find({ isListed: true });

        res.render("updateProducts", { product: product, category: category, ram: ram, processor: processor, display: display, storage: storage })

    } catch (error) {

    }



}

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.Id;

        const { name, description, brand, category, regularPrice, salePrice, quantity, RAM, processor, displaySize, storage } = req.body;
        console.log(RAM, processor, displaySize, storage, storage)

            let qstatus  = ""
        if(quantity == 0){
             qstatus = "Out Of Stock"
        }else if(quantity>5){
            qstatus = "Available"
        }else if(quantity <=5){
           
            qstatus = "Hurry up!"
        }



        const update = await productSchema.updateOne({ _id: productId }, {
            $set: {
                name,
                description,
                brand,
                category,
                regularPrice,
                salePrice,
                quantity,
                status: qstatus,
                specifications: {
                    RAM,
                    processor,
                    displaySize,
                    storage,
                }

            }
        })

        res.json({ message: "hello" })


    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Server error");
    }
};

const updateimage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const imageIndex = req.body.index;

        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const productData = await productSchema.findById(productId);
        
        if (!productData) {
            return res.status(404).json({ error: "Product not found" });
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await handleUpload(dataURI);

        
        // Update the specific image in the array
        productData.productImage[imageIndex] = result.secure_url;
        
        await productData.save();

        res.json({ 
            message: "Image updated successfully", 
            image: result.secure_url 
        });

    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).json({ 
            error: "Failed to update image",
            details: error.message 
        });
    }
};







module.exports = {

    LoadAddProduct,
    CreateProduct,
    getProducts,
    loadProductDetails,
    LoadupdateProduct,
    updateProduct,
    updateimage

}