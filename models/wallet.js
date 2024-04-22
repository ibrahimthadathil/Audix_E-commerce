const mongoose = require ('mongoose')
const walletSChema= new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    balance:{type:Number, required:true ,default:0},
    transaction:[{
        Amount:{type:Number},
        Time:{type:Date,default:Date.now},
        Status:{type:String,enum:['Debit','Credit']},
        Source:{type:String}
        
    }]
    
})

module.exports= mongoose.model('Wallet',walletSChema)