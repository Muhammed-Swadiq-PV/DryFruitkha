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
router.get('/payment-method', dashboard.paymentMethod);
router.get('/total-revenue' ,dashboard.totalRevenueGraph);
router.post('/show-revenue',dashboard.showRevenue);
router.get('/adminsales',dashboard.salesReportPage);
router.post('/adminsales', dashboard.filterSales);
router.get('/download-salesReport',dashboard.downloadSalesReport);



module.exports = router


