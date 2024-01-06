const coupon = require('../../model/coupon');

// ======================get the addcoupon page by sorting date ====================================

const createCoupon = async(req,res)=>{
    try {
      const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        const totalCouponsCount = await coupon.countDocuments();
        const totalPages = Math.ceil(totalCouponsCount / limit);
        const coupons = await coupon.find({ isActive: true }).skip(skip).limit(limit);
        const inactiveCoupons = await coupon.find({ isActive: false }).skip(skip).limit(limit);
 

        coupons.sort((a, b) => {
            
            return b.expiryDate - a.expiryDate;
          });
          const allCoupons = [...coupons, ...inactiveCoupons];

        res.render('admin/addCoupon', { coupons: allCoupons,couponData: coupons, currentPage:page, totalPages });
    } catch (error) {
        console.error(error.message)
    }
    
}

const checkCouponCode = async (req, res) => {
    try {
      const { couponCode } = req.query;
      const existingCoupon = await coupon.findOne({ couponCode });
  
      res.json({ exists: existingCoupon !== null });
    } catch (error) {
      console.error('Error checking coupon code existence:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

//=================================================  create coupon adding time =============================

const postCreateCoupon = async(req , res) =>{
    // console.log("inside post create coupon");
    try {
        const { couponCode, expiryDate, price, purchaseAmount } = req.body;
        console.log(req.body, " create couponile req.body");

        const existingCoupon = await coupon.findOne({ couponCode });

        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
          }

        const newCoupon = new coupon({
            couponCode,
            expiryDate,
            purchaseAmount,
            price,
            isActive: true 
        });

         await newCoupon.save();    
         res.status(200).json({ success: true});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

//========================================= delete coupon ============================================//

const deleteCoupon = async(req , res)=>{
    try {
       const couponId = req.body.id;
       console.log(couponId);
       const deletedCoupon =await coupon.findByIdAndDelete({_id: couponId}); 
       if (!deletedCoupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

}

//========================================= pass the data to modal for edit =================================================

const getCouponDetails = async (req, res) => {
    // console.log("inside get coupon details");
    try {
      const couponId = req.params.id;
      const couponDetails = await coupon.findById(couponId);
  
      if (!couponDetails) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
  
      // Respond with the coupon details
      res.json(couponDetails);
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


//====================================== edited update coupon to data base ===================================================

  const updateCoupon = async (req, res) => {
    try {
      const couponId = req.params.id;
      const { couponCode, expiryDate, price, purchaseAmount } = req.body;
  
      // Fetch the existing coupon based on the provided ID
      const existingCoupon = await coupon.findById(couponId);
  
      if (!existingCoupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      const duplicateCoupon = await coupon.findOne({ couponCode, _id: { $ne: couponId } });

    if (duplicateCoupon) {
        console.log("duplicate coupon");
      return res.status(400).json({ error: 'Duplicate coupon code' });
    }

      existingCoupon.couponCode = couponCode;
      existingCoupon.expiryDate = expiryDate;
      existingCoupon.price = price;
      existingCoupon.purchaseAmount = purchaseAmount;
  
      const updatedCoupon = await existingCoupon.save();
  
      res.json({ success: true, updatedCoupon });
    } catch (error) {
      console.error('Error updating coupon details:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


  const changeCouponStatus = async(req , res)=>{
    try {
      const {id: couponId } = req.params;
      console.log(req.params, "req.params");
      // Find the coupon by ID
      const tocoupon = await coupon.findById(couponId);
      console.log(tocoupon,"change coupon status id");
      
      tocoupon.isActive = !tocoupon.isActive;
  
      // Save the updated coupon
      await tocoupon.save();
  
      res.status(200).json({ success: true, message: 'Coupon status updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  

module.exports ={
    createCoupon,
    postCreateCoupon,
    deleteCoupon,
    getCouponDetails,
    updateCoupon,
    checkCouponCode,
    changeCouponStatus
}