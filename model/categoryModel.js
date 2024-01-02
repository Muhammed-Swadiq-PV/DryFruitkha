const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
   
    description:{
        type:String,
        
    },
    status:{
        type:Boolean,
        default:true
    },
    offerPercent:{
        type:Number,
        default : 0
    },
    expiryDate:{
        type : Date ,
        // required : true
    },

})

module.exports = mongoose.model('category',categorySchema)