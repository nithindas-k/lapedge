const Variant = require("../../models/variantModel");
const productSchema = require("../../models/productModel")
const categorySchema = require("../../models/categoryModel")
const userSchema = require("../../models/userSchema")
const path = require('path');
const fs = require('fs');
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");



const loadCreateVariant = async (req, res) => {
    try {
        res.render("createVariant")

    } catch (error) {

    }





}






const getVariantsPage = async (req, res) => {
    try {
     
        const ramVariants = await Variant.find({ category: 'ram' });
        const processorVariants = await Variant.find({ category: 'processor' });
        const displayVariants = await Variant.find({ category: 'display' });
        const storageVariants = await Variant.find({ category: 'storage' });

        res.render('variantmanagement', {
            ramVariants,
            processorVariants,
            displayVariants,
            storageVariants
        });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.VARIANT_LOAD_ERROR);
    }
}

const createVariant = async (req, res) => {
    try {
        const { variantType, variantValue } = req.body;
        console.log('Received variant data:', variantType, variantValue);



        const newVariant = new Variant({ category: variantType, value: variantValue, isBlocked: false });
        await newVariant.save();

        res.status(STATUS_CODES.OK).json({ variantType, variantValue, success: true });
    } catch (error) {
        console.error(`Error creating variant:`, error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.VARIANT_CREATE_ERROR);
    }
};

const editVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const variant = await Variant.findById(id);

        if (!variant) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.VARIANT_NOT_FOUND);
        }

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error loading edit variant page:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send('Error loading edit variant page');
    }
}


const updateVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;

        const variant = await Variant.findByIdAndUpdate(
            id,
            { value },
            { new: true }
        );

        if (!variant) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.VARIANT_NOT_FOUND);
        }

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.VARIANT_UPDATE_ERROR);
    }
}

const deleteVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Variant.findByIdAndDelete(id);

        if (!result) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.VARIANT_NOT_FOUND);
        }

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.VARIANT_DELETE_ERROR);
    }
}


const toggleBlockVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const variant = await Variant.findById(id);

        if (!variant) {
            return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.VARIANT_NOT_FOUND);
        }

        variant.isBlocked = !variant.isBlocked;
        await variant.save();

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error toggling variant block status:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.VARIANT_STATUS_ERROR);
    }


}

const createRamVariant = async (req, res) => {
    try {
        const { value } = req.body;
        const existingVariant = await Variant.findOne({ value, category: 'ram' });

        if (existingVariant) {
            return res.redirect('/variants?error=Ram variant already exists');
        }

        const newVariant = new Variant({
            value,
            category: 'ram',
            isBlocked: false
        });

        await newVariant.save();
        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error creating RAM variant:', error);
        res.status(500).redirect('/variants?error=Failed to create variant');
    }
}

const createProcessorVariant = async (req, res) => {
    try {
        const { value } = req.body;
        const existingVariant = await Variant.findOne({ value, category: 'processor' });

        if (existingVariant) {
            return res.redirect('/variants?error=Processor variant already exists');
        }

        const newVariant = new Variant({
            value,
            category: 'processor',
            isBlocked: false
        });

        await newVariant.save();
        res.redirect('/variants');
    } catch (error) {
        console.error('Error creating Processor variant:', error);
        res.status(500).redirect('/variants?error=Failed to create variant');
    }
}

const createDisplayVariant = async (req, res) => {
    try {
        const { value } = req.body;
        const existingVariant = await Variant.findOne({ value, category: 'display' });

        if (existingVariant) {
            return res.redirect('/variants?error=Display variant already exists');
        }

        const newVariant = new Variant({
            value,
            category: 'display',
            isBlocked: false
        });

        await newVariant.save();
        res.redirect('/variants');
    } catch (error) {
        console.error('Error creating Display variant:', error);
        res.status(500).redirect('/variants?error=Failed to create variant');
    }
}

const createStorageVariant = async (req, res) => {
    try {
        const { value } = req.body;
        const existingVariant = await Variant.findOne({ value, category: 'storage' });

        if (existingVariant) {
            return res.redirect('/variants?error=Storage variant already exists');
        }

        const newVariant = new Variant({
            value,
            category: 'storage',
            isBlocked: false
        });

        await newVariant.save();
        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error creating Storage variant:', error);
        res.status(500).redirect('/variants?error=Failed to create variant');
    }
}



module.exports = {
    toggleBlockVariant,
    deleteVariant,
    updateVariant,
    editVariant,
    createVariant,
    getVariantsPage,
    createRamVariant,
    createProcessorVariant,
    createDisplayVariant,
    createStorageVariant,
    loadCreateVariant,

};