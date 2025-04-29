const express = require("express");
const user_routers = express();

//requiring user controlles

const user_controller = require("../controllers/usercontroller");
// requiring profile controller

const profile_controller = require("../controllers/userProfile");

const address_controller = require("../controllers/address_controller");

const checkout_controller = require("../controllers/checkoutController");

const cart_controller = require("../controllers/cart_controller");

const order_controller = require("../controllers/orderController");

const product_controller = require("../controllers/product_controller");

const whish_controller = require("../controllers/whishlist_controller");

const wallet_controll = require("../controllers/userSide/wallet_controll");

const coupon_controller = require("../controllers/adminSide/coupon_controller");
// error handle

const errorHandler = (err, req, res, next) => {
  console.error('Error in user routes:', err);
  req.session.error = {
    status: err.status || 500,
    message: err.message || 'An unexpected error occurred'
  };
  res.redirect('/error');
};

user_routers.use(errorHandler);

// const

const user_auth = require("../middleware/user_auth");

// setting view for user

user_routers.set("view engine", "ejs");
user_routers.set("views", "./views/user");

// 404
user_routers.get("/error", async (req, res) => {
  try {
    const error = req.session.error || {
      status: 500,
      message: 'An unexpected error occurred'
    };
    
    // Clear the error from session
    delete req.session.error;
    
    // Get a more user-friendly title based on status code
    let errorTitle = 'Error';
    if (error.status === 404) {
      errorTitle = 'Page Not Found';
    } else if (error.status === 401) {
      errorTitle = 'Unauthorized';
    } else if (error.status === 403) {
      errorTitle = 'Access Denied';
    } else if (error.status === 500) {
      errorTitle = 'Server Error';
    }
    
    res.render('404', {
      listedCategory: [],
      errorMessage: error.message,
      statusCode: error.status,
      errorTitle: errorTitle
    });
  } catch (error) {
    console.error('Error rendering error page:', error);
    res.status(500).send('Error page not found');
  }
});

//showing home page

user_routers.get("/", user_auth.checkBlockedStatus, user_controller.loadHome);

// showing login

user_routers.get("/login", user_auth.islogin, user_controller.loadlogin);

//showing forget password

user_routers.get("/forgotpassword", user_controller.loadforgot);

// forget post

user_routers.post("/forgotpassword", user_controller.verifyforgot);

// showing forgot confirm password

user_routers.get(
  "/passwordVerify",
  user_auth.forgotUser,
  user_controller.passmatch
);

// confirm password post

user_routers.post("/passwordVerify", user_controller.passmatchsave);

// posting input data

user_routers.post("/login", user_controller.verifylogin);

// showing signuppage

user_routers.get("/signup", user_auth.islogin, user_controller.loadsignup);

// inserting user data

user_routers.post("/signup", user_controller.insertUser);

// showing otp page

user_routers.get("/verify", user_auth.islogin, user_controller.loadotpVerify);

// posting the otp digit for verification

user_routers.post("/verify", user_controller.verifyOTP);

// logout user

user_routers.post("/logout", user_controller.logoutUser);

// RESEND OTP

user_routers.get("/resend-otp", user_controller.resendOtp);

// Load category

user_routers.get(
  "/category/:id",
  user_auth.checkBlockedStatus,
  user_controller.loadCategory
);

// load products
user_routers.get(
  "/products",
  user_auth.checkBlockedStatus,
  user_controller.loadProducts
);

//load contact

user_routers.get(
  "/contact",
  user_auth.checkBlockedStatus,
  user_controller.loadContacts
);

//load about

user_routers.get(
  "/about",
  user_auth.checkBlockedStatus,
  user_controller.loadAbout
);

// product details

user_routers.get(
  "/productDetails",
  user_auth.checkBlockedStatus,
  user_controller.productView
);

// whishlist

user_routers.get(
  "/wishlist",
  user_auth.islogout,
  user_auth.checkBlockedStatus,
  user_controller.wishlist
);

//__________ user profile
user_routers.get(
  "/profile",
  user_auth.islogout,
  profile_controller.profileLoad
);

// edit user profile
user_routers.post("/editProfile", profile_controller.editProfile);
// change password
user_routers.post("/editPassword", profile_controller.passCange);

// aadd address show
user_routers.get("/Address", address_controller.loadAddress);
// add post
user_routers.post("/addAddress", address_controller.addAddress);
// delete address
user_routers.post("/deleteAddress", address_controller.deleteAddress);
// edit address sending to  frontentend
user_routers.put("/editaddresss", address_controller.showeditdata);
// edit address update
user_routers.post("/updateaddress", address_controller.updateAddress);

// load checkout
user_routers.get("/checkout", checkout_controller.loadcheckout);
// add address
user_routers.post("/checkoutAdd", checkout_controller.addAddresscheckout);

// cart load
user_routers.get(
  "/cart",
  user_auth.islogout,
  user_auth.checkBlockedStatus,
  cart_controller.cart
);

// add cart
user_routers.post("/addcart/:id", cart_controller.addCart);
//cart count
user_routers.post("/cartCount", cart_controller.cartCount);
//chooseaddress
user_routers.post("/chooseAddress", checkout_controller.chooseAddress);
//editCheckout
user_routers.put("/checkeditaddress", checkout_controller.editCheckout);
// update checkout
user_routers.post(
  "/updateAddresscheckout",
  checkout_controller.updateAddresscheckout
);

// delete cart
user_routers.post("/deleteCart/:id", cart_controller.deleteCart);
// cart update
user_routers.put("/cartUpdate", cart_controller.cartEdit);

//_______________________user Orders
user_routers.get("/orders", order_controller.loadOrder);

user_routers.post("/placeorder", order_controller.orderplace);
// failed payment 
user_routers.post('/faiedPayment',order_controller.failedPayment)

// user_router
user_routers.get("/orderDetails", order_controller.orderDetails);

// search product
user_routers.put("/searchProduct", product_controller.searchProduct);

// price filter

user_routers.put("/priceFilter", product_controller.priceFilter);

//ascending order

user_routers.put("/products/filter", product_controller.Ascend);

// price Ascrnding

user_routers.put("/products/Pricefilter", product_controller.priceAscend);

// thanks greeting

user_routers.get("/thanks", user_controller.Greeting);

// add whishlist

user_routers.post("/addWhishlist/:id", whish_controller.addWhishlist);

// delete product form whishlist

user_routers.put("/deleteWhish/:id", whish_controller.deleteWhish);

// user wallet

user_routers.get("/wallet", user_auth.islogout, wallet_controll.loadWallet);

// wallet razeor

user_routers.put("/walletAdd", wallet_controll.Recharge);

// add money into wallet
user_routers.post("/addMoney", wallet_controll.addMoney);

// fetch razor

user_routers.post("/razor", order_controller.razor);

// cancel order

user_routers.put("/cancelOrder", order_controller.cancelOrder);

// return order

user_routers.put("/returnOrder", order_controller.returnProduct);

// wallet usage

user_routers.put("/walletUse", wallet_controll.walletUse);

//  user_routers.use((err, req, res, next) => {

//   res.status(500).send('Something broke!');
// });

// user coupon

user_routers.get("/coupon", coupon_controller.UserCoupon);

// coupon apply
user_routers.put("/couponApply", coupon_controller.coupCheck);

// coupon use

user_routers.post("/couponUse", coupon_controller.couponUse);

// user_routers.get('/invoice/:id',order_controller.invoice)

user_routers.get("/invoiceDwld/:id", order_controller.invoiced);

user_routers.put("/couponRe", coupon_controller.couponRemove);

user_routers.put("/displaycoup", coupon_controller.displayCoupon);

module.exports = user_routers;
