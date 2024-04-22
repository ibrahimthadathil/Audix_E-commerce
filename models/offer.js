const mongoose = require('mongoose')
const offers = new mongoose.Schema({
    name:{type:String,required:true},
    category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'category'
    },
    offer:{
        type:Number,required:true
    }

})

module.exports=mongoose.model('offer',offers)