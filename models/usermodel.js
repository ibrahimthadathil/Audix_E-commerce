const mongoose = require('mongoose')

const userschema = new mongoose.Schema({

    fullname:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true
    },

    phone:{
        type:Number,
        required:true
    },

    password:{

        type:String,
        required:true

    },

    is_verified:{

        type:Boolean,
        default:false
    },

    is_admin:{

        type:Number,
        required:true
    },
    
    is_blocked:{
        type:Boolean,
        required:false
    },

    dateJoined:{
        type:Date,
        default:Date.now
    },
    appliedCoupon:[]
})


module.exports = mongoose.model('User',userschema)