const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');




//cart
const getCart = async (req, res) => {
    try {
      const userId = req.session.user;
  
      if (!userId) {
        // Redirect to login if userId doesn't exist
        return res.redirect('/login');
      }
  
      const user = await userModel.findById(userId).populate('cart.productId');
      const cartItem = user.cart.map(async(item) => {
        const product = await products.findOne({ _id: item.productId });

        let price;

        if (product.offer && product.expiryDate && new Date() <= product.expiryDate) {
          price = product.discountPrice;
        } else {
          price = product.price;
        }
        return {
          product: item.productId,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
          price: price,
        };
      });

      const resolvedCartItem = await Promise.all(cartItem);
      // console.log(cartItem);
      res.render('./users/cart', {  cartItem: resolvedCartItem, user });
    } catch (error) {
      console.error(error);
      res.redirect('/error?err=' + encodeURIComponent(error.message));
    }
  };


  const addToCart = async (req, res) => {
    try {
      const productId = req.params.id;
      const email = req.session.user;
  
      if (!email) {
        return res.status(401).json({ error: 'User not logged in' });
      }
  
      const user = await userModel.findOne({ _id: email });
      const product = await products.findOne({ _id: productId });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Default to product price
      let price = product.price;
  
      const categoriesWithOffer = await category.find({ offerPercent: { $gt: 0 }, expiryDate: { $gte: new Date() } });
      const categoryOffer = categoriesWithOffer.find(cat => cat._id.equals(product.category));
  
      if (categoryOffer && new Date(categoryOffer.expiryDate) >= new Date()) {
        // Apply category-level offer
        const discountedPrice = product.price - (product.price * (categoryOffer.offerPercent / 100));
        price = discountedPrice > 0 ? discountedPrice : product.price;
      } else if (product.offer && product.expiryDate && new Date() <= product.expiryDate) {
        // Check for product-level offer
        price = product.discountPrice > 0 ? product.discountPrice : product.price;
      }
  
      const totalPrice = price;
  
      if (user && user.cart) {
        // Check if the product is already in the cart
        const existingProduct = user.cart.find(
          (item) => item.productId.equals(productId)
        );
  
        if (existingProduct) {
          // If the product exists, update its quantity and total price
          existingProduct.quantity += 1;
          existingProduct.totalPrice += price;
        } else {
          // If the product doesn't exist, add it to the cart
          user.cart.push({
            productId: productId,
            quantity: 1,
            price: price,
            totalPrice: totalPrice,
          });
        }
      } else {
        // If there is no cart for the user, create a new cart
        user.cart = [
          {
            productId: productId,
            quantity: 1,
            price: price,
            totalPrice: totalPrice,
          },
        ];
      }
  
      await user.save();
      res.status(200).json({ response: "ok" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: error.message });
    }
  };
  
  

  //all line removing from cart
  const removeFromCart = async (req, res) => {
    try {
      const productId = req.params.id;
      
      const email = req.session.user;
      
      const user = await userModel.findOne({ _id: email }).populate('cart.productId');
      if (user && user.cart) {
      const itemIndex = user.cart.findIndex(
        (item) => item.productId._id.toString() === productId
      );

      if (itemIndex === -1) {
        return res
          .status(404)
          .json({ success: false, error: "Cart item not found" });
      }
      // Remove the item from the user's cart
      user.cart.splice(itemIndex, 1);
      await user.save();
      res
        .status(200)
        .json({ success: true, message: "Product removed from cart" });


      } else {
        return res.render('./users/404');
      }

    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  };


  // Update quantity and price from cart page

  const updateQuantityCart = async (req, res) => {
    try {
      const productId = req.params.id;
      const newQuantity =req.body.newQuantity;
      // console.log(newQuantity,"lsjkljhkhreihjoei newquantity in updatequantity");

               // Fetch the product to get stock
        const product = await products.findOne({ _id: productId });
        
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const stock = product.stock;

        // Check if the new quantity exceeds the available stock
        if (newQuantity > stock) {
            return res.status(400).json({ success: false, error: 'Cannot exceed available stock' });
        }
  
      const user = await userModel.findOneAndUpdate(
        { _id: req.session.user, 'cart.productId': productId },
        { $set: { 'cart.$.quantity': newQuantity } },
        { new: true }
      );
        // console.log(user);
      // Recalculate subtotal and total
      const updatedCart = user.cart.map(product => {
        const productPrice = parseFloat(product.price);
        const quantity = parseInt(product.quantity, 10);
  
        if (!isNaN(productPrice) && !isNaN(quantity)) {
          product.totalPrice = productPrice * quantity;
          return product;
        } else {
          console.error('Invalid price or quantity for product:', product);
          return product;
        }
      });
  
      // Calculate subtotal and total based on the updated cart
      const shippingCharge = 90;
      const subtotal = updatedCart.reduce((sum, product) => sum + product.totalPrice, 0);
      const total = subtotal + shippingCharge;
  
      // Update the user document with the new subtotal and total
      user.subtotal = subtotal;
      user.total = total;
      await user.save();
  
      // Send the updated cart data back to the client
      res.json({ cart: updatedCart, subtotal, total });
    } catch (error) {
      console.error('Error updating quantity in the database', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  module.exports ={
    getCart,
    addToCart,
    removeFromCart,
    updateQuantityCart,
  }