const mongose = require ('mongoose')

const Brand = new mongose.Schema({

name : { type : String , required : true}

})

module.exports = mongose.model('Brand',Brand)