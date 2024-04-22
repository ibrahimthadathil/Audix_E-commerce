const mongoose = require ('mongoose')

const coupon = new  mongoose.Schema({
name:{
    type:String,
    required : true
},
from:{
    type:Number ,
    required : true
},
to:{
    type:Number,
    required: true
},
  discount:{  
    type:Number,
    
},

couponcode :{
    type:String,
    required: true
},
image:{
    type: String ,
    required: true
},
status:{
    type: Boolean,
    required:true,
    default:true
},
details:{
    type:String
}



})

module.exports = mongoose.model ('coupons',coupon)