const user =require('../../model/userModel');
const Order = require('../../model/orderModel');






//for Users
const getAdminUserPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;

        const skip = (page - 1) * limit;
        const totalCount = await user.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);

        const userData = await user.find().skip(skip).limit(limit)
    
        res.render('admin/adminUsers',{userData ,currentPage: page, totalPages})
    } catch (error) {
       console.log(error.message) 
    }
}

//for block and unblock
const getStatusUsers = async (req , res)=>{
    try {
        const userId =  req.params.id
        console.log("user id :",userId)
         const userData = await user.findById({_id:userId})

         if(userData){
            if(userData.status === true){
                // console.log("userdata status is true");
                await user.findByIdAndUpdate({ _id:userId}, {$set: {status:false}})
            }else{
                // console.log('userdata status is false');
                await user.findByIdAndUpdate({ _id:userId} , {$set: {status:true}})
            }
         }
         res.redirect('/admin/adminUsers')

    } catch (error) {
        console.log(error.message);
    }
}

const getOrders = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8; // Adjust the limit as needed

        const skip = (page - 1) * limit;
        const totalOrdersCount = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrdersCount / limit);
        const orders = await Order.find().sort({ orderDate: -1 }).skip(skip).limit(limit);
        
        res.render('./admin/orders', {orders, currentPage: page, totalPages });
    } catch (error) {
        console.error(error.message);
    }
}

const updateOrderStatus = async (req, res) => {
    const { orderId, orderStatus } = req.body;
    console.log(orderId, orderStatus);
    
    try {
        // Update the order status in the database based on orderId
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, updatedOrder });
    } catch (error) {
        // Handle errors appropriately
        console.error('Error updating order status', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {
    getAdminUserPage,
     getStatusUsers,
     getOrders,
     updateOrderStatus
    }
