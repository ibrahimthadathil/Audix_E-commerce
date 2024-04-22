
const mongoose = require('mongoose')
const newcart = new mongoose.Schema({
    
    userId : {type : String , required: true} ,
    product : [{
        productId : {type : mongoose.Schema.Types.ObjectId , ref :'Products'},
        quantity:{type:Number,required:true,default:1},
        price : {type : Number , required : true}
    }],
    Total_price : {type : Number,required:true},
    couponDiscount : {type:Number,required:true,default:0},
    discountRate : {type :Number ,required:true,default:0}
})

module.exports = mongoose.model('Cart',newcart)
