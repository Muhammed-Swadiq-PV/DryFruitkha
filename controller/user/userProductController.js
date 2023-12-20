const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');



//---------------get shop page-------------------------------
//===========================================================

const getShop = async(req , res) =>{
    try {
        const userId = req.session.user
    const user = await userModel.findOne({_id:userId})
        const productData = await products.find({status:true});
        const Category = await category.find();
        const Categories = Array.from(new Set(Category.map(cat => cat.name)));

        res.render('users/shop',{productData, Categories, user:user||false})
    } catch (error) {
        console.log(error.message)
    }
}


//---------------get single product page-------------------
//===========================================================

const getSingleProduct = async(req , res) =>{
try {
    const userId = req.session.user
    const user = await userModel.findOne({_id:userId})
    const productId = req.query.productId;
    const product = await products.findOne({_id:productId}).populate('categoryDetails');
     console.log(product.image, "get single product ile image");
    // console.log(product.categoryModel, "get single product ile category model");

    res.render('users/singleProduct',{product , user:user||false})
} catch (error) {
    console.log(error.message)
}
}


  
 

  





  
  




module.exports = {
    getShop,
    getSingleProduct,
   
   
};