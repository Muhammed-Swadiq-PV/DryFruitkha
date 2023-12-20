const mongoose=require('mongoose')

const orderSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    products:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'products'
        },
        name:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
     
    }],
    orderStatus:{
        type:String,
        required:true
    },
    total:{
        type:Number
    },
    orderDate:{
        type:Date,
        default:Date.now
    },
    address: [{

        firstName:{type:String},
        LastName:{type:String},
        address:{type:String},
        Postcode: { type: Number },
        city: { type: String },
        state: { type: String },
        district: { type: String },
        phones:{type:Number}
    }],

    payment: {
        type: String,
        required: true,
        enum: ['cashondelivery', 'razorpay']
    },
    
    
})


module.exports = mongoose.model('Order',orderSchema)