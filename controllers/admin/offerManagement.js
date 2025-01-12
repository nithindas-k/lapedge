
const mongoose = require("mongoose");
const categorySchema = require("../../models/categoryModel")
const productSchema = require("../../models/productModel")
const offerSchema = require("../../models/offerModel")



const loadOfferPage = async (req, res) => {

    try {

        const offers = await offerSchema.find({}).populate("categoryOrProduct")
        res.render('offer',{
            offers: offers
        })

    } catch (error) {

        console.log('Offer page not found', error)
        res.status(200).redirect('/404')

    }

}

const addOfferPage = async (req, res) => {

    try {
        res.render('addOffer')

    } catch (error) {
        console.log('Add Offer page not found', error)
        res.status(200).send('server error')

    }



}



const getCategories = async (req, res) => {
    try {
        const categories = await categorySchema.find({});
        res.json({ success: true, items: categories });
    } catch (error) {
        console.error('Error loading categories:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const getProducts = async (req, res) => {
    try {
        const products = await productSchema.find({});
        res.json({ success: true, items: products });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addOffer = async (req, res) => {

    try {
        const { name, type, categoryOrProduct, discountType, discountValue, minPurchase, startDate, endDate, status, description } = req.body;
        const offer = new offerSchema({
            name: name,
            type: type,
            categoryOrProduct: categoryOrProduct,
            discountType: discountType,
            discountValue: discountValue,
            minPurchase: minPurchase,
            startDate: startDate,
            endDate: endDate,
            status: status,
            description: description
        })


        if(type == "Category"){
            const category = await categorySchema.findById(categoryOrProduct)

            const products = await productSchema.find({category:categoryOrProduct})
            products.forEach(async (product) => {

                if(discountType == "Percentage" ){
                    product.productOffer = product.salePrice
                    product.offerPersentage = discountValue
                   
                    
                    const discountedPrice =  parseInt((product.salePrice * discountValue / 100))
                    product.salePrice = product.salePrice - discountedPrice
                }else if(discountType == "Fixed Amount"){
                     product.offerPersentage = discountValue

                    product.salePrice = product.salePrice -parseInt(discountValue)
                    if(  product.salePrice <= 0){
                        return res.status(400).json({success :false , message :"there is a issue in price calculating"})
                        
                    }

                }
                await product.save()
            })
        }

        if(type == "Product"){
            const product = await productSchema.findById(categoryOrProduct)
            if(discountType == "Percentage" ){
                product.productOffer = product.salePrice
                const discountedPrice =  parseInt((product.salePrice * discountValue / 100))
                product.salePrice = product.salePrice - discountedPrice
            }else if(discountType == "Fixed Amount"){
               
                product.salePrice = product.salePrice - discountValue
                if(  product.salePrice <= 0){
                    return res.status(400).json({success :false , message :"there is a issue in price calculating"})
                    
                }


               
                

            }
            await product.save()
        }

        





        await offer.save()
        res.status(200).json({ success: true, message: "Offer created successfully." });




    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "An error occurred." });

    }
}


const loadEditPage  =  async (req , res )=>{
    try {

        const {id} = req.params
        const offer = await offerSchema.findById(id)
        if(!offer){
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
            res.render("editOffer",{
                offer: offer
            })

        
    } catch (error) {
        
    }

}

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        let offer = await offerSchema.findById(id);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.type == "Product") {
            let product = await productSchema.findById(offer.categoryOrProduct);

           
            if (!product.originalPrice) {
                product.originalPrice = product.salePrice;
                
                await product.save();
            }

       
            if (offer.discountType == "Fixed Amount") {
                product.salePrice = product.salePrice + parseInt(offer.discountValue); 
                product.offerPersentage = 0
                await product.save();
            } else if (offer.discountType == "Percentage") {
    
                product.salePrice = product.productOffer
                product.productOffer = 0
                product.offerPersentage = 0
                
                await product.save();
            }
        }

        if(offer.type == "Category"){
            let products = await productSchema.find({category: offer.categoryOrProduct})
            if(offer.discountType == "Fixed Amount"){
                products.forEach(async (product) => {
                    product.salePrice = product.salePrice + parseInt(offer.discountValue); 
                    product.offerPersentage = 0
                    await product.save()
                })

            }else if(offer.discountType == "Percentage"){
                products.forEach(async (product) => {
                    product.salePrice = product.productOffer
                    product.productOffer = 0
                    product.offerPersentage = 0
                    await product.save()
                })


            }
           
        }





        await offerSchema.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Offer deleted successfully." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

          






module.exports = {
    loadOfferPage,
    addOfferPage,
    getCategories,
    getProducts,
    addOffer,
    loadEditPage,
    deleteOffer

}