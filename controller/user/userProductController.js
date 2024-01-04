const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');



//---------------get shop page-------------------------------
//===========================================================

const getShop = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await userModel.findOne({ _id: userId });

        //searchQuery category and product wise
        const searchQuery = req.query.searchQuery || '';

        const page = parseInt(req.query.page) || 1; 
        const pageSize = 6; // Number of products per page

        let productQuery;
        if (searchQuery) {
            // If searchQuery exists, search by product name or category name
            const Category = await category.findOne({ name: searchQuery });

            if (Category) {
                // If searchQuery checking by  category, 
                productQuery = {
                    category: Category._id,
                    status: true
                };

            } else {
                //  search by product name
                productQuery = {
                    name: { $regex: new RegExp(searchQuery, 'i') },
                    status: true
                };
            }
        } else {
            // If no search query, show  all products
            productQuery = { status: true };
        }

        // filtering by price from - price to
        const { priceFrom, priceTo } = req.query;
        console.log(req.query, "prices");
        if (priceFrom && priceTo) {
            productQuery.price = { $gte: parseInt(priceFrom), $lte: parseInt(priceTo) };
        }

        const totalProducts = await products.countDocuments(productQuery);
        const totalPages = Math.ceil(totalProducts / pageSize);
        // console.log(productQuery, "product query");
        const productData = await products.find(productQuery).populate('categoryDetails').skip((page - 1) * pageSize)
            .limit(pageSize);

        const Category = await category.find();

        const Categories = Array.from(new Set(Category.map(cat => cat.name)));
        const categoriesWithOffer = Category.filter(cat => cat.offerPercent > 0);




        res.render('users/shop', {
            productData, Categories, categoriesWithOffer, user: user || false, currentPage: page,
            totalPages,  priceFrom, priceTo,
            
        });
    } catch (error) {
        console.log(error.message)
    }
}


//---------------get single product page-------------------
//===========================================================

const getSingleProduct = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await userModel.findOne({ _id: userId })
        const productId = req.query.productId;
        const product = await products.findOne({ _id: productId }).populate('categoryDetails');
        const Category = await category.find();

        const currentDate = new Date();
        const categoriesWithOffer = Category.filter(cat => cat.offerPercent > 0);
        //  console.log(product.image, "get single product ile image");
        // console.log(product.categoryModel, "get single product ile category model");

        res.render('users/singleProduct', { product, user: user || false, currentDate, categoriesWithOffer });
    } catch (error) {
        console.log(error.message)
    }
}

















module.exports = {
    getShop,
    getSingleProduct,


};