const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');
const coupon = require('../../model/coupon');


const getwalletPage = async(req , res)=>{
    try {
        const userId = req.session.user;
  
        if (!userId) {
          // Redirect to login if userId doesn't exist
          return res.redirect('/login');
        }
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const walletData = user.wallet;
        
          res.render('./users/wallet',{walletData});
    } catch (error) {
        console.error(error);
    }
}

const orderWithWalletAmount = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await userModel.findById(userId).populate('cart.productId');
        const cartItem = user.cart.map(item => ({
            product: item.productId,
            name: item.productId.name,
            price: item.totalPrice,
            quantity: item.quantity,
        }));

        // Assuming the wallet balance is stored in the user's wallet array
        const walletBalance = user.wallet.length > 0 ? user.wallet[user.wallet.length - 1].balance : 0;

    
        const shippingCharge = 90;
        const subtotal = cartItem.reduce((sum, item) => sum + item.price, 0);
        const couponDiscount = req.session.couponDiscount || 0;
        const totalAfterDiscount = couponDiscount > 0 ? subtotal - couponDiscount : subtotal;

        const totalAmount = totalAfterDiscount + shippingCharge;

        // Check if the wallet balance is sufficient
        if (walletBalance >= totalAmount) {
            // Deduct the total amount from the wallet balance
            const updatedBalance = walletBalance - totalAmount;

            // Save the updated wallet balance
            user.wallet.push({
                balance: updatedBalance,
                date: Date.now(),
                debitAmount: totalAmount,
                transactionType: 'Debit'
            });

            await user.save();

            // Place the order
            const defaultAddress = user.address.find(address => address.isDefault);
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
                payment: 'wallet'
            });

            await order.save();

            // Clear the user's cart
            user.cart = [];
            await user.save();

            return res.json({ success: true, message: 'Order placed successfully with wallet amount.' });
        } else {
            // Return error response if the wallet balance is insufficient
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

    } catch (error) {
        console.error('Error placing order with wallet amount:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


module.exports = {
    getwalletPage,
    orderWithWalletAmount
}