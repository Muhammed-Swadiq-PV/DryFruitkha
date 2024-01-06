const products = require('../../model/productModel');
const Category = require('../../model/categoryModel');
const user = require('../../model/userModel');
const Order = require('../../model/orderModel');
const { Parser } = require('json2csv')



const getDashboard = async (req, res) => {
    try {
        if (req.session.admin) {

            const totalUsers = await user.countDocuments({ status: true });
            const totalOrders = await Order.countDocuments({ orderStatus: "Delivered" });
            const revenue = await Order.aggregate([
                {
                    $match: {
                        orderStatus: "Delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total' },
                    },
                },
            ])
            let totalRevenue
            if (revenue.length === 0) {
                totalRevenue = 0
            } else {
                totalRevenue = revenue[0].totalRevenue
            }



            // Render the dashboard with data
            res.render('admin/adminDashboard', {
                totalUsers,
                totalOrders,
                totalRevenue

            });
        } else {
            // Redirect to login if not logged in as admin
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).send('Internal Server Error');
    }
};





const paymentMethod = async (req, res) => {
    try {
        const onlinePayment = await Order.countDocuments({ payment: 'razorpay' });
        const cashOnDelivery = await Order.countDocuments({ payment: 'cashondelivery' });
        const walletPayment = await Order.countDocuments({ payment: 'wallet'})
        res.json({ onlinePayment, cashOnDelivery , walletPayment});
    } catch (error) {
        console.error(error)
        res.redirect('/error?err=' + encodeURIComponent(error.message))
    }
}




const totalRevenueGraph = async (req, res) => {
    try {
        const orders = await Order.find({ orderStatus: "Delivered" });

        // console.log(orders);
        const revenueData = orders.reduce((acc, order) => {
            const orderDate = new Date(order.orderDate);
            const year = orderDate.getFullYear();
            const month = orderDate.getMonth() + 1;
            if (!acc[year]) {
                acc[year] = {};
            }
            if (!acc[year][month]) {
                acc[year][month] = 0;
            }
            acc[year][month] += isNaN(order.total) ? 0 : order.total;

            return acc;
        }, {});
        // console.log(revenueData);
        res.json(revenueData);
    } catch (error) {
        console.error(error)
        res.redirect('/error?err=' + encodeURIComponent(error.message))

    }
}




const showRevenue = async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate + 'T00:00:00Z'); 
        const endDate = new Date(req.body.endDate + 'T23:59:59Z');

        const orders = await Order.find({
            orderStatus: 'Delivered',
            orderDate: { $gte: startDate, $lte: endDate },
        });

        if (orders.length === 0) {
            console.log("There is no order");
        }

        const revenueData = orders.reduce((acc, order) => {
            const orderDate = new Date(order.orderDate);
            const year = orderDate.getUTCFullYear();
            const month = orderDate.getUTCMonth() + 1;

            if (!acc[year]) {
                acc[year] = {};
            }

            if (!acc[year][month]) {
                acc[year][month] = 0;
            }

            acc[year][month] += order.total;
            return acc;
        }, {});

        // console.log(revenueData, "showRevenue");
        res.json(revenueData);
    } catch (error) {
        console.error(error);
        res.redirect('/error?err=' + encodeURIComponent(error.message));
    }
};


const salesReportPage = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;
        const totalOrdersCount = await Order.find({ orderStatus: 'Delivered' }).countDocuments();
        const totalPages = Math.ceil(totalOrdersCount / limit);

        const orders = await Order.find({orderStatus:'Delivered'})
        .populate('userId')
        .sort({ orderDate: 'desc' })
            .skip(skip)
            .limit(limit);
        res.render('admin/adminSales',{orders, currentPage: page, totalPages})
    } catch (error) {
        console.error(error);
    }
}


const filterSales = async (req, res) => {
    try {
        console.log("inside filter sales");
        let orders;

        console.log("the end date",req.query.endDate)
        console.log("the start date",req.query.startDate)

       
        if (req.query.startDate && req.query.endDate) {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;

            
            orders = await Order.find({
                orderDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
                orderStatus:'Delivered',
            }).populate('userId');
        } else {
            
            orders = await Order.find({orderStatus:'Delivered'}).populate('userId');
        }

        // Send the filtered data as JSON response
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const downloadSalesReport=async(req,res)=>{
    try {
        const { startDate,endDate }=req.query
        // console.log(req.query);
        const orders=await Order.find({orderStatus:'Delivered',orderDate:{$gte:startDate,$lte:endDate}}).populate('userId').sort({ orderDate: -1 });
        // Extract the necessary data fields
    const data = orders.map((order) => ({
        DATE: order.orderDate ? order.orderDate.toISOString().split('T')[0] : '',
        'ORDER ID': `#${order._id.toString().slice(0, 9)}`,
        USERNAME: order.userId.firstName,
        'PAYMENT METHOD': order.payment,
        'TOTAL AMOUNT': `${order.total}`,
      }));
        res.json(data)
    } catch (error) {
        console.error(error)
        // res.redirect('/error?err=' + encodeURIComponent(error.message));
    }
}


module.exports = {
    getDashboard,
    paymentMethod,
    totalRevenueGraph,
    showRevenue,
    salesReportPage,
    filterSales,
    downloadSalesReport
};
