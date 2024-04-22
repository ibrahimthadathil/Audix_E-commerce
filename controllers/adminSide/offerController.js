const Products = require('../../models/product')
const Category = require ('../../models/category')
const OFFER = require ('../../models/offer')


const offerload = async ( req , res ) => {
    try {
        const offerproducts = await Products.find({discount:{$gt:0}})
        const categories = await Category.find({is_listed:true})
        const offer = await OFFER.find().populate('category')
        const flash = req.flash('flash')
        res.render('offer',{product:offerproducts,cate:categories,offer,msg:flash})
    } catch (error) {
        console.log(error);
    }
}
// offerupdate
const offerAdd = async ( req , res) => {
    try {
        const {offname,cate,offer}= req.body
        const cats = await Category.findOne({name:cate})
        const discProduct = await Products.find({'category': cats._id}).populate('category')
        const exist = await OFFER.findOne({$or: [
            
            { name: { $regex: new RegExp(offname, 'i') } },
            { category: cats._id } 

        ]}).populate('category')
        

        if(!exist){

            discProduct.forEach(async(element) => {
                const discounts= Math.round((element.price / 100) * (100 - offer))
                await Products.findOneAndUpdate({name:element.name},{$set:{discount:offer,discout_price:discounts}})
                
            })

            const newOffer = new OFFER({
                name:offname,
                category:cats._id,
                offer:offer
            })

            newOffer.save()

            res.redirect('/admin/offer')
            
        }else{
            req.flash('flash','Already Added ')
            res.redirect('/admin/offer')
        }
        
     
        
    } catch (error) {
        console.log(error.message);
    }
}

// remove offer
const removeoff = async ( req , res )=> {

    try {
        const id = req.params.id
        const reOffer = await OFFER.findOne({_id:id}).populate('category')
        console.log(reOffer.category.name);
        const productss = await Products.find({'category':reOffer.category._id}).populate('category')
        productss.forEach(async(val)=>{
            await Products.findOneAndUpdate({name:val.name},{$set:{discount:0,discout_price:0}})
        })
        await OFFER.findOneAndDelete({_id:id})
        res.redirect('/admin/offer')
        
    } catch (error) {
        console.log(error);
    }
}
module.exports = {
    offerload,
    offerAdd,
    removeoff
}