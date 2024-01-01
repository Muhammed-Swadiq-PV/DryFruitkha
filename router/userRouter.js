const express =require('express')
const router =express()
const usercontroller = require('../controller/user/userController')
const userMiddleware = require('../middleware/userMiddleware')
const userProductController = require('../controller/user/userProductController')
const cartController = require('../controller/user/cartController')
const addressController = require('../controller/user/addressController')
const orderController = require('../controller/user/orderController');
const wishlistController = require('../controller/user/wishlistController');
const walletController = require('../controller/user/walletController');


router.get('/',userMiddleware.blockStatus,usercontroller.gethome)
router.get('/login',usercontroller.getLogin);

//logout user
router.get('/logout',usercontroller.postLogout)

router.get('/signup',usercontroller.getSignUp)

router.post('/signup',usercontroller.postSignUp);
//otp verification
router.get('/verifyOTP',usercontroller.getVerification)
router.post('/verifyOTP/resentOTP', usercontroller.resentOTP);
router.post('/verifyOTP', usercontroller.postOTPverification);

router.post('/login',usercontroller.postLogin)
router.post('/changePassword',usercontroller.changePassword);

router.get('/verifyEmail',userMiddleware.blockStatus,usercontroller.getVerifyEmail);
router.post('/verifyEmail',userMiddleware.blockStatus, usercontroller.verifyEmail);

router.get('/forgotOTP', userMiddleware.blockStatus,usercontroller.getOTPforPassword);
router.post("/verifyForgotOTP",usercontroller.postVerifyForgotOTP);
router.post("/resendForgotOTP", usercontroller.postResendForgotOTP);

router.get('/resetPassword',userMiddleware.blockStatus,usercontroller.getResetPassword);
router.post("/resetPassword",usercontroller.postResetPassword);

//home shop
router.get('/shop',userMiddleware.blockStatus,userProductController.getShop)
// singleProduct
router.get('/singleProduct',userMiddleware.blockStatus,userProductController.getSingleProduct);

//wishlist
router.get('/wishlist',userMiddleware.blockStatus,wishlistController.getWishlist)
router.post('/addToWishlist/:id',userMiddleware.blockStatus,wishlistController.postWishlist);
router.post('/wishlist/remove/:id',userMiddleware.blockStatus,wishlistController.removeWishlist);

//cart
router.get('/cart',userMiddleware.blockStatus,cartController.getCart);
router.post('/addToCart/:id',userMiddleware.blockStatus,cartController.addToCart);
router.delete('/removeFromCart/:id',userMiddleware.blockStatus,cartController.removeFromCart);
router.patch('/updateCartItemQuantity/:id',userMiddleware.blockStatus,cartController.updateQuantityCart);


//checkOut
router.get('/checkOut',userMiddleware.blockStatus,orderController.getCheckOut);
router.post('/addAddressCheckout',userMiddleware.blockStatus,addressController.addAddressCheckout)
router.post('/placeOrder',userMiddleware.blockStatus, orderController.placeOrder);
router.post('/razorpayOrder',userMiddleware.blockStatus,userMiddleware.blockStatus,orderController.razorpayOrder);
router.post('/orderOnline',userMiddleware.blockStatus, orderController.afterPayment);
router.get('/lastpage',userMiddleware.blockStatus,orderController.getLastPage);
router.post('/applyCoupon' ,userMiddleware.blockStatus,orderController.applyCoupon);

//userProfile and address
router.get('/userProfile',userMiddleware.blockStatus,addressController.getUserProfile);
router.post('/address',userMiddleware.blockStatus,addressController.addAddress);
router.post('/setDefaultAddress/:addressId',userMiddleware.blockStatus,userMiddleware.blockStatus, addressController.setDefaultAddress);
router.delete('/deleteAddress/:addressId',userMiddleware.blockStatus, addressController.deleteAddress);
router.post('/update-address',userMiddleware.blockStatus, addressController.updateAddress);
router.post('/updateProfile',userMiddleware.blockStatus, addressController.updateUserProfile);


//addressBook
router.get('/addressBook',userMiddleware.blockStatus,addressController.getAddressBook);

//order 
router.get('/orderDetails',userMiddleware.blockStatus,orderController.getOrderDetails);
router.get('/viewDtailsOrder/:orderId',userMiddleware.blockStatus,orderController.getReturnOrder);
router.get('/OrderInvoice/:orderId',userMiddleware.blockStatus,orderController.orderInvoice);
router.patch('/updateOrderStatus/:orderId',userMiddleware.blockStatus,orderController.cancelOrder);
router.patch('/returnOrder/:orderId',userMiddleware.blockStatus,orderController.returnOrder);

router.get('/wallet',userMiddleware.blockStatus,walletController.getwalletPage);
router.post('/walletOrder',userMiddleware.blockStatus,walletController.orderWithWalletAmount)







module.exports = router