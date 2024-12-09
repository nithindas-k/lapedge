const categorySchema = require("../../models/categoryModel"); 
const productSchema = require("../../models/productModel");
const path = require('path');
const fs = require('fs');



const loadCategories = async (req, res) => {
    try {
        const search = req.query.search || ''; 
        let categories;

        const currentPage = parseInt(req.query.page) || 1; 
        const itemsPerPage = 4;
        const skip = (currentPage - 1) * itemsPerPage;

        if (search) {
            categories = await categorySchema.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }).skip(skip).limit(itemsPerPage);
        } else {
            categories = await categorySchema.find().skip(skip).limit(itemsPerPage);
        }

        const totalCategories = await categorySchema.countDocuments();
        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        res.render("categories", { categories, search, currentPage, itemsPerPage, totalPages });
    } catch (error) {
        res.redirect("/error");
    }
};



const loadCreateCategory = (req, res) => {
    res.render("createCategory");
};


const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file ? req.file.filename : null;

        //category already exists
        const existingCategory = await categorySchema.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category with the same name already exists." });
        }

        // Create new category
        const newCategory = new categorySchema({ name, description, image })
        await newCategory.save()

        res.status(200).json({ success: true, message: "Category created successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
};


const loadEditCategory = async (req, res) => {
    try {
        const category = await categorySchema.findById(req.params.id);
        res.render("editCategory", { category });
    } catch (error) {
        res.redirect("/error");
    }
};


const updateCategory = async (req, res) => {
    try {
        const { name, description, croppedImage } = req.body;
        const categoryId = req.params.id;

        // name already exists in the database 
        const existingCategory = await categorySchema.findOne({
            name: { $regex: new RegExp('^' + name + '$', 'i') }, 
            _id: { $ne: categoryId } 
        });

        if (existingCategory) {
            
            return res.redirect('/category/edit/' + categoryId + '?status=error&message=Category name already exists');
        }

        let updatedData = { name, description }

       
        if (croppedImage) {
            const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "").replace(/\s/g, '');
            const uploadDir = path.join(__dirname, '../../public/uploads');

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const imageFilename = `${Date.now()}.jpg`;
            const imagePath = path.join(uploadDir, imageFilename);

            // Save image 
            fs.writeFileSync(imagePath, base64Data, 'base64');
            updatedData.image = imageFilename; 
        }

        // Update category 
        await categorySchema.findByIdAndUpdate(categoryId, updatedData);

       
        res.redirect('/category?status=success');
    } catch (error) {
        console.error('Error updating category:', error);

   
        res.redirect('/category/edit/' + req.params.id + '?status=error');
    }
};



const toggleCategoryListing = async (req, res) => {
    try {
        const categoryId = req.params.id;

     
        const category = await categorySchema.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

    
        category.isListed = !category.isListed;

        category.status = category.isListed ? 'listed' : 'unlisted';
         await productSchema.updateMany({category:categoryId},{$set:{isBlocked:!category.isListed}})
    
        await category.save();

       
        res.json({
            success: true, 
            status: category.isListed ? 'listed' : 'unlisted', 
            message: category.isListed ? 'Category has been listed successfully!' : 'Category has been unlisted successfully!'
        });
    } catch (error) {
        console.error("Error toggling category listing:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the category status." });
    }
};








module.exports = {
    loadCategories,
    loadCreateCategory,
    createCategory,
    loadEditCategory,
    updateCategory,

    toggleCategoryListing
};