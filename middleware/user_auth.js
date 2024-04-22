const User = require('../models/usermodel')

const islogout = async (req, res, next) => {
    
    try {

        if (!req.session.user) {
            
            return res.redirect('/login');

        } else {

            next();

        }
        
    } catch (error) {

        console.log(error.message);
        
    }

};
// user forgot password
const forgotUser = async (req,res,next)=>{
    try {
        if(req.session.forgetData){
            next()
            
        }else{
            return res.redirect('/forgotpassword')
        }
        
    } catch (error) {
        
    }
}

const islogin = async (req, res, next) => {
    
    try {
    
        if (req.session.user) {
            
            return res.redirect('/');

        }

        next()
        
    } catch (error) {

        console.log(error.message);
        
    }

};


const checkBlockedStatus = async (req, res, next) => {
    try {

        if(req.session.user){

            const userData = await User.findOne({_id : req.session.user._id});

            if(userData.is_blocked == true){

                delete req.session.user
                return res.redirect('/login');

            } else {

                next()

            }

        } else {

            next()

        }
      
    } catch (error) {

        console.log(error.message);
       
    }
};


















module.exports = {
    islogin,
    checkBlockedStatus,
    islogout,
    forgotUser
}