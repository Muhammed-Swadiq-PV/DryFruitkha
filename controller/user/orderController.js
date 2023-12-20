const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');
const Razorpay = require('razorpay');




 //------------------------------getCheckOut------------------------------
 //=======================================================================

 const getCheckOut = async (req, res) => {
    try {
      const userId = req.session.user;
  
      if (!userId) {
        return res.redirect('/login');
      }
  
      const user = await userModel.findById(userId).populate('cart.productId');
  
      // Find the default address
      const defaultAddress = user.address.find(address => address.isDefault);
  
      const cartItem = user.cart.map(item => {
        return {
          product: item.productId,
          name: item.productId.name,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
        };
      });
      
      
      const subtotal = cartItem.reduce((sum,item) => sum + item.totalPrice,0)
      const shippingCharge = 90;
      const total = subtotal + shippingCharge;
  
      // console.log(subtotal,"subtotal",total,"total");
      res.render('./users/checkout', { cartItem, user, defaultAddress, subtotal, total });
  
    } catch (error) {
      console.error(error);
  
      res.status(500).send("Internal Server Error");
    }
  }
  
  
  //------------------------- place order -----------------------------
  //=====================================================================
  
  
  const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
  
        
        const user = await userModel.findById(userId).populate('cart.productId');
        const cartItem = user.cart.map(item => ({
            product: item.productId,
            name: item.productId.name,
            price: item.totalPrice, 
            quantity: item.quantity,
        }));
        
        const paymentMethod = req.body.paymentMethod.toLowerCase(); 
        // console.log(paymentMethod,"placeorderile cah on delivery");

        const shippingCharge = 90;
        const subtotal = cartItem.reduce((sum, item) => sum + item.price, 0);
        const total = subtotal + shippingCharge;
  
  
        
        // Get the user's default address
        const defaultAddress = user.address.find(address => address.isDefault);

        for (const item of cartItem) {
          const product = item.product;
          const existingProduct = await products.findById(product._id);
          existingProduct.stock -= item.quantity;
          await existingProduct.save();
        }

  
        // Create the order
        const order = new Order({
            userId,
            products: cartItem.map(item => ({
                productId: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
            })),
            orderStatus: 'Pending',
            total: parseFloat(total),
            address: defaultAddress,
            payment: paymentMethod
        });
        // console.log({order},"order details in cash on delivery");
  
        await order.save();
  
        user.cart = [];
        await user.save();
  
  
    } catch (error) {
        console.error(error);
        res.render('./users/404')
    }
  };
  
  
  
  const razorpayOrder = async (req, res) => {
    
    try {
      const userId = req.session.user;
     
      const user = await userModel.findById(userId).populate('cart.productId');
      const cartItem = user.cart.map(item => ({
        product: item.productId,
        name: item.productId.name,
        price: item.totalPrice,
        quantity: item.quantity,
      }));
  
      // Calculate total amount for Razorpay
      const shippingCharge = 90;
      const subtotal = cartItem.reduce((sum, item) => sum + item.price, 0);
      const totalAmount = subtotal + shippingCharge;
  
      // Prepare options for creating a Razorpay order
      const instance = new Razorpay({
        key_id: 'rzp_test_Kxp2z1D1shF2jK',
        key_secret: 's02D9qdJStCCduNwdpgCO4Bd',
      });
      const options = {
        amount: totalAmount * 100, 
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          userId: userId,
        },
      };
  
      instance.orders.create(options, function (err, order) {
        if (order) {
            console.log(order);
            console.log('online success')
            res.json({
                onlineSuccess: true,
                order: order,
                key: "rzp_test_Kxp2z1D1shF2jK",
            });
        } else if (err) {
            console.error('error from here', err);
            res.status(500).json({ error: 'Error creating Razorpay order' });
        }
    });

    

      

   
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const afterPayment = async(req,res) =>{
    const userId = req.session.user;
    try {
      const user = await userModel.findById(userId).populate('cart.productId');
      const cartItem = user.cart.map(item => ({
        product: item.productId,
        name: item.productId.name,
        price: item.totalPrice,
        quantity: item.quantity,
      }));  

      // Calculate total amount for Razorpay
      const shippingCharge = 90;
      const subtotal = cartItem.reduce((sum, item) => sum + item.price, 0);
      const totalAmount = subtotal + shippingCharge;

      const paymentMethod = 'razorpay';

      const defaultAddress = user.address.find(address => address.isDefault);

      for (const item of cartItem) {
        const product = item.product;
        const existingProduct = await products.findById(product._id);
        existingProduct.stock -= item.quantity;
        await existingProduct.save();
      }

      const order = new Order({
        userId,
        products: cartItem.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
        })),
        orderStatus: 'Pending',
        total: parseFloat(totalAmount),
        address: defaultAddress,
        payment: paymentMethod
    });

    await order.save();

      
      user.cart = [];
      await user.save();
      res.json({success: true, message: " order placed"})
    } catch (error) {
      console.error('Error creating  order in online paymentf', error);
      res.render('./users/404')
     
    }
  }
  
  
  
  const getOrderDetails = async(req,res)=>{
    try {
      const userId = req.session.user;
  
      if (!userId) {
        return res.redirect('/login');
      }
  
      const orders = await Order.find({userId}).sort({ orderDate: -1 });
      const user = await userModel.findById(userId)
  
      if (!orders) {
        return res.render('./users/404')
      }
  
      res.render('users/orderDetails', { orders , user});
       
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.render('./users/404')
    }
  }


  const getLastPage = async(req , res)=>{
    try {
       return res.render('./users/lastPage');
    } catch (error) {
      res.render('./users/404')
    }
  }
  
  
  
  
  const getReturnOrder = async(req,res)=>{
    try {
      const orderId = req.params.orderId;
      const userId = req.session.user;
      const user = await userModel.findById(userId);
      const order = await Order.findById(orderId);
  
      res.render('./users/returnOrder',{user,orderId,order});
  
    } catch (error) {
      console.error(error.message);
    }
  }
  
  
  const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
      
    try {
  
        const order = await Order.findById(orderId);
        // console.log(order, "order inside cancel order");
        if (!order) {
            return res.render('./users/404');
        }
  
        if (order.orderStatus !== 'Pending') {
            return res.render('./users/404')
        }
        order.orderStatus = 'Canceled';
        await order.save();
        
        res.json({ success: true, updatedOrder: order });
    } catch (error) {
        
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  
  const returnOrder = async (req, res) => {
    const { orderId } = req.params;
  
    try {
        
        const order = await Order.findById(orderId);
        // console.log(order,"order inside the return order");
       
        if (!order) {
            return res.render('./users/404');
        }
        if (order.orderStatus !== 'Delivered') {
            return res.render('./users/404');
        }
        order.orderStatus = 'Returned';
        await order.save();
        res.json({ success: true, updatedOrder: order });
    } catch (error) {
       
        console.error('Error returning order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
 



  const orderInvoice = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId).populate('products.productId');
      const user = await userModel.findById(order.userId);
  
  
      res.render('./users/invoice', { order, user });
    } catch (error) {
      console.error(error.message);
      // res.render('./users/404');
    }
  };
  
  
  module.exports = {
    getCheckOut,
    placeOrder,
    getOrderDetails,
    getReturnOrder,
    cancelOrder,
    returnOrder,
    razorpayOrder,
    afterPayment,
    getLastPage,
    orderInvoice
  }