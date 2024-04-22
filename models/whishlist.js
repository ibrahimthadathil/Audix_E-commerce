const mongoose = require ('mongoose')
const whishlistSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        requires:true,

    },
    products:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Products'
        }
    }]
})
module.exports=mongoose.model('whishlist',whishlistSchema)