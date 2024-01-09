const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');


const getWishlist = async (req, res) => {
    try {
        const email = req.session.user;
        const user = await userModel
        .findOne({ _id: email })
        .populate("wishlist.product");
         
      if (!user) {
        res.redirect('/login');
      }
      const wishlist = user.wishlist.map((item) => item.product);
      //  
  
      res.render("users/wishlist", {  user , wishlist });
    } catch (error) {
        console.error(error.message);
    }
};



const postWishlist = async (req, res) => {
    try {
      const productId = req.params.id;
      // console.log(productId);
      const email = req.session.user;
  
      // Find the user by email
      const user = await userModel.findOne({_id: email});
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!Array.isArray(user.wishlist)) {
        user.wishlist = []; 
      }
      if (user.wishlist.some(item =>  item.product && item.product.toString() === productId)) {
        return res.status(409).json({ message: "Product already exists in wishlist" });
      }
      
      user.wishlist.push({ product: productId });
  
      // Save the updated user object
      await user.save();
  
      return res.status(200).json({ message: "Product added to wishlist" });
    } catch (error) {
      console.error("Error adding product to wishlist:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };


  const removeWishlist = async(req,res)=>{
    try {
      // console.log("inside the remove wishlist");
      const email = req.session.user;
      const productIdToRemove = req.body.productId;
      // console.log(productIdToRemove,"product id to remove");
  
      // Remove the wishlist item with the specified productId
      await userModel.updateOne(
        { _id: email },
        { $pull: { wishlist: { product: productIdToRemove } } }
      );
  
      res.status(200).send('Wishlist item removed successfully');
    } catch (error) {
      
    }
  }

module.exports ={
    getWishlist,
    postWishlist,
    removeWishlist
}