const express =require('express')
const router =express.Router()
const  {loggedIn,loggedout ,configureMulter} = require('../middleware/adminMIddleware');
const upload = configureMulter()

//controllers
const adminController = require('../controller/admin/adminController')
const productController = require('../controller/admin/adminProductController')
const categoryController = require('../controller/admin/adminCategoryController')
const usersController = require('../controller/admin/adminUser');
const dashboard = require('../controller/admin/dashboard');
const coupon = require('../controller/admin/adminCoupon');







//to get admin login page
router.get('/',adminController.getlogin);
router.get('/login' ,loggedout,adminController.getlogin)
//post admin login
router.post('/postLogin', adminController.postlogin);
// to post admin dashboard
router.post('/postAdminDashboard' ,adminController.postlogin );
// admin logout destroy session
router.get('/logout', adminController.postLogout)



//adminProduct
router.get('/product',loggedIn,productController.getAdminProductPage);

//add product
router.get('/add-Product' ,loggedIn, productController.getAddProduct);
router.post('/product', upload.array('image',4),productController.postAddProduct);
router.get('/product-status/:id',loggedIn,productController.getStatusproduct);

//edit product
router.get('/edit-product/:id',loggedIn,productController.getEditProduct);
router.post('/edit-product/', upload.array('image',4), productController.postEditProduct);
router.post('/add-image', loggedIn, upload.array('image'), productController.postAddImage);
router.post('/delete-image/:id', loggedIn, productController.postDeleteImage);



//adminCategory
router.get('/category',loggedIn,categoryController.getAdminCategoryPage);
router.post('/add-category',categoryController.AddAdminCategoryPage);
router.get('/category-status/:id',loggedIn, categoryController.getStatusCategory);
router.post('/edit-category/:id',categoryController.editCategory);


//adminUsers
router.get('/adminUsers',loggedIn,usersController.getAdminUserPage);
router.get('/userStatus/:id',loggedIn,usersController.getStatusUsers);

//order management
router.get('/orders',loggedIn,usersController.getOrders);
router.patch('/updateOrderStatus', usersController.updateOrderStatus);



//to get admin dashboard
router.get('/adminDashboard',loggedIn,dashboard.getDashboard);
router.get('/payment-method', loggedIn,dashboard.paymentMethod);
router.get('/total-revenue' ,loggedIn,dashboard.totalRevenueGraph);
router.post('/show-revenue',dashboard.showRevenue);
router.get('/adminsales',loggedIn,dashboard.salesReportPage);
router.post('/adminsales', dashboard.filterSales);
router.get('/download-salesReport',loggedIn,dashboard.downloadSalesReport);


router.get('/addCoupon',loggedIn,coupon.createCoupon);
router.get('/checkCouponCode',loggedIn, coupon.checkCouponCode);
router.post('/addCoupon',coupon.postCreateCoupon);
router.post('/couponDelete/:id',coupon.deleteCoupon);
router.get('/couponDetails/:id',loggedIn,coupon.getCouponDetails);
router.patch('/updateCoupon/:id',coupon.updateCoupon);
router.patch('/couponToggleStatus/:id',coupon.changeCouponStatus);


module.exports = router


