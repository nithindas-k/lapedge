const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const userSchema = require("../../models/userSchema")
const path = require('path');
const fs = require('fs');
const variantSchema = require("../../models/variantModel")
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");


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
        res.redirect("/admin/error")
    }

}




const CreateProduct = async (req, res) => {
    try {
        const { name, description, brand, category, regularPrice, salePrice, quantity, RAM, processor, displaySize, storage } = req.body;

        let qstatus = ""
        if (quantity == 0) {
            qstatus = "Out Of Stock"
        } else if (quantity > 5) {
            qstatus = "Available"
        } else if (quantity <= 5) {

            qstatus = "Hurry up!"
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

     
        await newProduct.save();

        const products = await productSchema.find();

        return res.status(STATUS_CODES.OK).json({
            message: MESSAGES.PRODUCT_CREATED_SUCCESS,
            product: newProduct,
            products: products
        });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            message: MESSAGES.PRODUCT_CREATE_ERROR,
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

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
};


const LoadupdateProduct = async (req, res) => {

    try {

        const ram = await variantSchema.find({ isBlocked: false, category: "ram" }).populate("category")
        const processor = await variantSchema.find({ isBlocked: false, category: "processor" }).populate("category")
        const display = await variantSchema.find({ isBlocked: false, category: "display" }).populate("category")
        const storage = await variantSchema.find({ isBlocked: false, category: "storage" }).populate("category")
        const productId = req.params.Id
        const product = await productSchema.findById(productId)
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

        let qstatus = ""
        if (quantity == 0) {
            qstatus = "Out Of Stock"
        } else if (quantity > 5) {
            qstatus = "Available"
        } else if (quantity <= 5) {

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

        res.status(STATUS_CODES.OK).json({ message: MESSAGES.PRODUCT_UPDATED_SUCCESS })


    } catch (error) {
        console.error("Error updating product:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Server error");
    }
};

const updateimage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const imageIndex = req.body.index;

        if (!req.file) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ error: MESSAGES.PRODUCT_IMAGE_REQUIRED });
        }

        const productData = await productSchema.findById(productId);

        if (!productData) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ error: MESSAGES.PRODUCT_NOT_FOUND });
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await handleUpload(dataURI);



        productData.productImage[imageIndex] = result.secure_url;

        await productData.save();

        res.status(STATUS_CODES.OK).json({
            message: MESSAGES.IMAGE_UPDATED_SUCCESS,
            image: result.secure_url
        });

    } catch (error) {
        console.error('Error updating image:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            error: MESSAGES.IMAGE_UPDATE_FAILED,
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