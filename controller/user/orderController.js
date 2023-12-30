const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');
const coupon = require('../../model/coupon');
const Razorpay = require('razorpay');
require('dotenv').config();



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
      
      const addresses = user.address;
      
      const subtotal = cartItem.reduce((sum,item) => sum + item.totalPrice,0)
      const shippingCharge = 90;
      const total = subtotal + shippingCharge;

      const availableCoupons = await coupon.find({ isActive: true });
        
  
      // console.log(subtotal,"subtotal",total,"total");
      res.render('./users/checkout', { cartItem, user, defaultAddress, subtotal, total , addresses , availableCoupons});
  
    } catch (error) {
      console.error(error);
  
      res.status(500).send("Internal Server Error");
    }
  }

 //-------------------------Apply coupon for order -----------------------------
  //=====================================================================
  const applyCoupon = async (req, res) => {
    let error;
    try {
        const userId = req.session.user;
        const couponCode = req.body.coupon;

        // console.log(userId, couponCode, "apply couponile userid um coupon codum");

        const user = await userModel.findById(userId).populate('cart.productId');
        const cartItem = user.cart.map(item => ({
            product: item.productId,
            name: item.productId.name,
            price: item.totalPrice,
            quantity: item.quantity,
        }));

        const appliedCoupon = await coupon.findOne({ couponCode, isActive: true });
        // console.log('Stored Coupon Code:', appliedCoupon ? appliedCoupon.couponCode : 'Not found');

        if (!appliedCoupon) {
            error = "Invalid coupon code";
            return res.status(400).json({ success: false, error });
        }

        if (cartItem.reduce((sum, item) => sum + item.price, 0) >= appliedCoupon.purchaseAmount) {
            const couponDiscount = appliedCoupon.price;
            const shippingCharge = 90;
            const subtotal = cartItem.reduce((sum, item) => sum + item.price, 0);
            const totalBeforeDiscount = subtotal + shippingCharge;
            //  console.log(couponDiscount, "total before discount");
             req.session.couponDiscount = couponDiscount || 0;

            const totalAfterDiscount = Math.max(totalBeforeDiscount - couponDiscount, 0);
            console.log(totalAfterDiscount,"total after discount")
            // Respond with success and the updated information
            res.status(200).json({ success: true, totalAfterDiscount, couponDiscount });
        } else {
            error = "Purchase amount does not meet the coupon requirements";
            // Respond with error message
            res.status(400).json({ success: false, error });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};




  
  
  //------------------------- Cash on delivery -----------------------------
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

        const couponDiscount = req.session.couponDiscount || 0;
        const totalAfterDiscount = couponDiscount > 0 ? subtotal - couponDiscount : subtotal;

        const total = totalAfterDiscount + shippingCharge;
  
  
        
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
  
  //------------------------- Razorpay order -----------------------------
  //=====================================================================
  
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
      const couponDiscount = req.session.couponDiscount || 0;
        const totalAfterDiscount = couponDiscount > 0 ? subtotal - couponDiscount : subtotal;

        const totalAmount = totalAfterDiscount + shippingCharge;
  
      
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      // Prepare options for creating a Razorpay order
      const instance = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
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
  
  //------------------------- Order details page -----------------------------
  //===========================================================================
  
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
  

  //-------------------------Cancel the ordered product if it razorpay paid amount will be added to wallet-----------------------------
  //====================================================================================================================================
  
  const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
      
    try {
  
        const order = await Order.findById(orderId);
        const userId = req.session.user;
        

        for (const item of order.products) {
          const product = await products.findById(item.productId);
          product.stock += item.quantity;
    
          await product.save();
        }
        
        if(order.payment==='razorpay' || order.paymentMethod==='Wallet'){
          const user=await userModel.findById(userId).select('wallet')
          let oldBalance=0
          if(user.wallet.length>0){
            oldBalance=user.wallet[user.wallet.length-1].balance
          }
          const walletData={
            balance:oldBalance+order.total,
            date:Date.now(),
            creditAmount:order.total,
            transactionType:'Credit'
          }
          // console.log(walletData, "razorpay");


          user.wallet.push(walletData)
          await user.save()
          order.orderStatus='Canceled';
          await order.save()
          return res.json({message:'Order cancelled and refunded successfully'})
        }else{
          order.orderStatus='Canceled';
          await order.save()
          return res.json({message:'Order cancelled successfully'})
         
        }
    } catch (error) {
        
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  //------------------------- Return order and add the paid amount to wallet -----------------------------
  //=======================================================================================================
  
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

        for (const item of order.products) {
          const product = await products.findById(item.productId);
    
          product.stock += item.quantity;
    
          await product.save();
        }
        const userId = req.session.user;
        const user = await userModel.findById(userId).select('wallet');

        let oldBalance = 0;

        if (user.wallet.length > 0) {
            oldBalance = user.wallet[user.wallet.length - 1].balance;
        }

        const walletData = {
            balance: oldBalance + order.total,
            date: Date.now(),
            creditAmount: order.total,
            transactionType: 'Credit'
        };

        user.wallet.push(walletData);
        await user.save();

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
    orderInvoice,
    applyCoupon
  }