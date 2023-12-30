const mongoose=require('mongoose')

const couponSchema=new mongoose.Schema({
    couponCode:{
        type:String,
    },
    expiryDate:{
        type:Date,
    },
    purchaseAmount:{
        type:Number,
    },
    price:{
        type:Number,
    },
    isActive:{
        type:Boolean,
        default:true
    }
})

module.exports=mongoose.model('Coupon',couponSchema)