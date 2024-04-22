const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    discout_price:{
        type :Number,
        default:0
    },
    discount:{
        type:Number,
        default:0
    },
    stock: {
        type: Number,
        required: true,
    },
    category:{type :mongoose.Schema.Types.ObjectId, required:true , ref : 'category'},
    description:{
        type:String,
        required:true
    },
    brand:{
        type :String,
        required :true
    },
    image:{
        type:Array,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    createdAt:{
        type:Date,
        required:true
    },
    damagedStock:{
        type:Number,
        default:0
    }

});

module.exports = Products = mongoose.model('Products',productSchema);

