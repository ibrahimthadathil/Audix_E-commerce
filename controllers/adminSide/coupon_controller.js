const User = require ('../../models/usermodel')
const category = require ('../../models/category')
const Coupons = require ('../../models/coupons')
const Cart = require ( '../../models/cart')

// user side coupon load

const UserCoupon = async (req ,res ,next) => {
    try {

        const listedCategory = await category.find({ is_listed: true });
        if(req.session.user){
            const availableCoupon = await Coupons.find({status:true})
            res.render('profile/userCoupons',{listedCategory,login:req.session.user,coupon:availableCoupon})
    }else{

            res.render('profile/userCoupons',{listedCategory})

        }
    } catch (error) {
       next()
    }
}

// admin side coupon load 
const Admincoupon = async ( req , res ) =>{
    try {
        const availablecoupon = await Coupons.find()
        
        res.render('coupon',{availablecoupon})
    } catch (error) {
        
    }
}
const addcoupon = async  ( req , res ) => {
    try {
        const {coupon,code,minimum,maximum,discount,details}=req.body
        const couponimage = req.files[0].filename

    const newCoupon = new Coupons({
        name:coupon,
        couponcode:code,
        from:minimum,
        to:maximum,
        discount:discount,
        image:couponimage,
        details:details

    })
        newCoupon.save()
    res.redirect('/admin/coupons')




        
    } catch (error) {
        console.log(error);
    }
}

// action status

const statusAction = async ( req , res ) => {
    try {
       const update = await Coupons.findOne({_id:req.params.id})
       update.status=!update.status
       update.save()
        res.send({changed:true})
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCoupon = async ( req , res ) =>{
    try {
        const Coupondelet = await Coupons.findByIdAndDelete({_id:req.params.id})
    } catch (error) {
        
    }
}
// check coupon
const coupCheck = async ( req , res ) => {
    try {
        const data = req.body.in
        const check = await Coupons.findOne({couponcode:data})
        if(check){
            res.send({found:true})
        }else{
            res.send({not:true})
        }
    } catch (error) {
        
    }
}

// use coupon

const  couponUse = async ( req , res ) => {
    try {
       enterCoupon = req.body.coupon
       const check = await Coupons.findOne({couponcode:enterCoupon,status:true})
       if(check){
        const useCheck = await User.findOne({_id:req.session.user._id,appliedCoupon:{$in:[check.couponcode]}})
        if(useCheck){
            req.flash('flash','used')
            res.redirect('/checkout')
        }else{
          const cartData = await Cart.findOne({userId:req.session.user._id})
             const cartAmt = cartData.Total_price
             if(cartAmt<=check.from){
                req.flash('flash','limit needed')
                res.redirect('/checkout')
             }else{
                const deductedprice = Math.round((cartData.Total_price / 100) * (100 - check.discount));

                console.log(cartData.Total_price ,' ' ,check.discount,' ',deductedprice,' ',cartAmt-deductedprice);

                const updatedCart= await Cart.findOneAndUpdate({_id:cartData._id},{$set:{ Total_price : deductedprice , couponDiscount : cartAmt-deductedprice , discountRate:check.discount }}, { new: true } )
                await User.findOneAndUpdate({_id:req.session.user._id},{$push:{appliedCoupon:check.couponcode}})
                req.flash('flash','applied')
                res.redirect('/checkout')
             }

        }
       }else{
        req.flash('flash','expaired')
        res.redirect('/checkout')
       }
    } catch (error) {
        console.log(error);
    }
}
// remove coupon 
const cartTotal=async(req,res)=>{
    const listedCategory = await category.find({ is_listed: true });
    const userdata = await User.findById({ _id: req.session.user._id });

    if (req.session.user) {
        const userProduct = await Cart.findOne({ userId: req.session.user._id }).populate('product.productId');

        if (userProduct) {
            for (let product of userProduct.product) {
                if (!product.productId.status||product.productId.stock<=0) {
                    product.price = 0; 
                }
            }
            const cartData = await Cart.findOne({userId:req.session.user._id}).populate('product.productId')
            const totalPrice = userProduct.product.reduce((acc, product) => acc + product.price, 0);
            let afterCoupon = totalPrice
            if(cartData.product.length<=0  ){
              await Cart.findOneAndUpdate({_id:cartData._id},{$set:{couponDiscount:0}})
            }
            if (userProduct.couponDiscount>0) {
             
             afterCoupon =totalPrice - userProduct.couponDiscount;
          }
           
            const updatedCart = await Cart.findOneAndUpdate(
                { userId: req.session.user._id },
                { $set: { Total_price: afterCoupon } },
                { new: true, upsert: true }
            );
            
           
        }
}}

const couponRemove = async ( req , res ) => {
    try {
        const cartid= req.body.id
        const find = await Cart.findOne({userId:req.session.user._id})
        let add = find.couponDiscount
        console.log(add);
        const useCart = await Cart.findOneAndUpdate({userId:req.session.user._id,_id:cartid},{$set:{couponDiscount:0,discountRate :0,$inc:{Total_price:add}}})
        console.log(useCart);
        const usser = await User.findOneAndUpdate({_id:req.session.user._id},{$pop:{appliedCoupon:1}})
        cartTotal(req,res)
       ;
       res.send({su:true}).status(200)
    } catch (error) {
        console.log(error.message);
    }
}
// 
const displayCoupon = async ( req , res )=>{
    try {
        
        const couponfind = await User.findOne({_id:req.session.user._id})
        const recentCoupon = couponfind.appliedCoupon[couponfind.appliedCoupon.length-1]
        res.send({coupon : recentCoupon})
    } catch (error) {
        
    }
}
module.exports ={
    UserCoupon,
    Admincoupon,
    addcoupon,
    statusAction,
    deleteCoupon,
    coupCheck,
    couponUse,
    couponRemove,
    displayCoupon
}

