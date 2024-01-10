const mongoose = require('mongoose');
const shortid = require('shortid');

const userSchema=mongoose.Schema({


    Firstname:
        {type:String},
    Lastname:
        {type:String},
    email:
        {type:String},
    password:
        {type:String},
    confirmPassword:
        {type:String},
    phone:
        {type:String},
    status:{
        type:Boolean , 
        default:true
    },
    cart:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'products',
           
        },
        quantity:{
            type:Number,
           
        },
        price:{
            type:Number,
        },
        totalPrice:{
            type:Number,
        }
    }],
    address: [{

        firstName:{type:String},
        LastName:{type:String},
        address:{type:String},
        Postcode: { type: Number },
        city: { type: String },
        state: { type: String },
        district: { type: String },
        phones:{type:Number},

        isDefault: {
            type: Boolean,
            default: false, 
          },
  }],
  wishlist:[{
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'products',
       
    },
    
  }],
  wallet:[{
    balance:{
        type:Number,
        default:0
    },
    date:{
        type:Date
    },
    creditAmount:{
        type:Number
    },
    debitAmount: {
        type: Number
    },
    transactionType:{
        type:String
    }
}],
referralCode: {
    type: String,
    unique: true,
    default: shortid.generate,
},  

       
})

module.exports=mongoose.model('user',userSchema)