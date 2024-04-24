const User = require ('../models/usermodel')
const Address = require ('../models/address')
const category = require ('../models/category');


const loadAddress = async (req, res) => {
    try {

        if(req.session.user){

            const listedCategory = await category.find({is_listed:true})
            const userdata = await User.findById({_id:req.session.user._id})
            const addressList = await Address.findOne({userId:req.session.user._id}) || null
            const flash = req.flash('flash')

            res.render('Profile/address',{listedCategory,userdata,login:req.session.user,addressList,msg:flash}) 

        }else{

            res.redirect('/login')

        }
       
        } catch (error) {
        
            console.log(error.message);

        }
}


const addAddress = async ( req , res ) => { 
    try {

        const user = req.query.id   
        const getAddress = req.body.address
        const exist = await Address.findOne({userId:user,addresss:{$elemMatch:{name:getAddress.address}}})
        
        if(!exist){
                const   newAddress = await Address.findOneAndUpdate( {userId:user},
                { $addToSet:{
                    addresss:{ userName:req.session.user.fullname ,
                            name:getAddress.address , 
                            city:getAddress.city , 
                            state:getAddress.state ,
                            phone:getAddress.phone ,
                            pincode:getAddress.pincode }      
                    }},
                    {new:true ,upsert:true}
                )
                    if(newAddress){

                        res.send({success:true})

                    }    
        }else{
                res.status(400).send({failed:true})
        }

        } catch (error) {
            
            console.log(error.message);
            
        }
}

// delete Address
const deleteAddress = async ( req , res ) => {
    try {
        const  user = req.query.id
        const addres = req.query.address
        const remove = await Address.updateOne({userId:user},{$pull:{addresss:{_id:addres}}}) 
       
        res.send({seleted:true})

    } catch (error) {
        
        console.log(error.message);

    }
}
// show edit data 
const showeditdata = async ( req , res ) => {
    try {
        const dataId = req.body.input
        const editdata = await Address.findOne({'addresss._id':dataId},{'addresss.$':1})
        
        res.json({editdata})

    } catch (error) {
        
        console.log(error.message);

    }
}
// update address
const updateAddress = async ( req ,res ) => {
    try {
        
        const user = req.session.user._id
        const {address,city,state,pincode,phone,id} = req.body
        
        const updatedata = await Address.findOneAndUpdate({userId:user,'addresss._id':id},{$set:{'addresss.$.name':address,'addresss.$.city':city,'addresss.$.state':state,'addresss.$.pincode':pincode,'addresss.$.phone':phone}})
        if(updateAddress){

            req.flash('flash','success')
            res.redirect('/Address')

        }else{

            req.flash('flash','failed')
            res.redirect('/Address')

        }
    } catch (error) {

        console.error('Error updating address:', error);
        return res.status(500).json({ error: 'Internal server error' });

    }
}



module.exports ={
loadAddress,
addAddress,
deleteAddress,
showeditdata,
updateAddress
}





