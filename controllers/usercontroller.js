const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const otp = require("../models/OTPmodel");
const flash = require("express-flash");
const { trusted } = require("mongoose");
const Otp = require("../models/OTPmodel");
require("dotenv").config();
const { EMAIL_USER, EMAIL_PASSWORD } = process.env;
const Address = require("../models/address");
const category = require("../models/category");
const Products = require("../models/product");
const { find } = require("../models/whishlist");
const whishlist = require("../models/whishlist");
const BrandsMod = require("../models/Brand");

const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//***************Load home**************

const loadHome = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });

    const allProduct = await Products.find({}).populate("category");

    if (req.session.user) {
      res.render("homepage", {
        login: req.session.user,
        listedCategory,
        allProduct,
      });
    } else {
      res.render("homepage", { listedCategory, allProduct });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//*********load signup */

const loadsignup = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    const flash = req.flash("flash");
    const passflash = req.flash("passflash");
    res.render("signup", { msg: flash, conpass: passflash, listedCategory });
  } catch (error) {
    console.log(error.message);
  }
};

//********Load login**********/

const loadlogin = async (req, res, next) => {
  try {
    delete req.session.forgetData;

    const listedCategory = await category.find({ is_listed: true });

    const flash = req.flash("flash");
    res.render("login", { msg: flash, listedCategory });
  } catch (error) {}
};
//***************load forgot passs */

const loadforgot = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    const flash = req.flash("flash");
    res.render("forgett", { msg: flash, listedCategory });
  } catch (error) {}
};

/***********verify forget */
const verifyforgot = async (req, res, next) => {
  try {
    forgetemail = req.body.email;
    const emailcheck = await User.findOne({ email: forgetemail });
    req.session.forgetData = emailcheck;

    if (emailcheck) {
      const user = emailcheck.fullname;

      if (emailcheck) {
        const OTp = generateOTP();
        req.session.otp = OTp;
        console.log("forget otp  :- " + OTp);
        const genaratetoken = generateToken();
        await forgotOtpMail(forgetemail, user, OTp, genaratetoken, res);
      }
    } else {
      req.flash("flash", "not verified");
      res.redirect("/forgotpassword");
    }
  } catch (error) {}
};

//*******mail for Forget password */

const forgotOtpMail = async (email, user, sendotp, tokenNO, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // compose email
    const mailOption = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "For Restore your password",
      html: `<h3>Hello ${user},Welcome To AUDIX</h3> <br> <h4>Enter : ${sendotp} on the OTP Box to change your forgotten pawssword</h4>`,
    };

    //send mail
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log("Erro sending mail :- ", error.message);
      } else {
        console.log("Email has been sended :- ", info.response);
      }
    });
    // otp schema adding

    const hashtokon = await securepassword(tokenNO);

    const forgetotp = await Otp.create({
      emailId: email,
      otp: sendotp,
      token: hashtokon,
    });
    // await forgetotp.save();
    const createdAt = Date.now();
    res.redirect(`/verify?email=${email}&&tokenid=${hashtokon}&td=${createdAt}`);
  } catch (error) {}
};

//****loadpassmatch-forgot */

const passmatch = async (req, res, next) => {
  try {
    const email = req.query.email;

    const listedCategory = await category.find({ is_listed: true });
    const flash = req.flash("flash");
    res.render("forgotconfirm", { msg: flash, listedCategory, email });
  } catch (error) {}
};

//**********confirm password */
const passmatchsave = async (req, res, next) => {
  try {
    const bodyEmail = req.body.email;
    const passwordbdy = req.body.password;
    const confirmpass = req.body.re_password;
    const hashpassword = await securepassword(confirmpass);


    if (passwordbdy == confirmpass) {
      delete req.session.otp;
      const updateuser = await User.findOneAndUpdate(
        { email: bodyEmail },
        { $set: { password: hashpassword } }
      );
      req.flash("flash", "changed");
      res.redirect("/passwordVerify");
    } else {
      console.log("problem in update");
    }
  } catch (error) {
    console.log(error.message);
  }
};
//***********verifyLogin******** */

const verifylogin = async (req, res, next) => {
  try {
    const bodyEmail = req.body.email;
  
    const verifiedUser = await User.findOne({
      email: bodyEmail,
      is_verified: true,
    });
   

    const blockedUser = await User.findOne({ email: bodyEmail, is_blocked: true });

    if (blockedUser) {
      req.flash(
        "flash",
        "Your account has been blocked,Please contact for assistance"
      );
      res.redirect("/login");
    } else if (verifiedUser) {
      const passsword = req.body.password;

      const passwordMatch = await bcrypt.compare(
        passsword,
        verifiedUser.password
      );

      if (passwordMatch) {
        req.session.user = verifiedUser;
        req.session.otpTime = undefined
        res.redirect("/");
      } else {
        req.flash("flash", "invalid password");
        res.redirect("/login");
      }
    } else {
      req.flash("flash", "You are not a verified user");
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// insert user

const insertUser = async (req, res, next) => {
  try {
    const bodyEmail = req.body.email;

    // check the mail from the database

    const emailCheck = await User.findOne({ email: bodyEmail });

    if (emailCheck) {
      req.flash("flash", "Email already exist");
      res.redirect("/signup");
    } else {
      // const hashpassword = await securepassword(req.body.password)

      // insert user

      const user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        is_admin: 0,
        is_blocked: false,
      });
      const password = req.body.password;
      const confirmPassword = req.body.re_password;

      if (confirmPassword == password) {
        // const userData = await user.save()

        // saving the input details into the session

        req.session.saveUser = user;

        const userData = req.session.saveUser;

        if (userData) {
          const OTP = generateOTP();
          req.session.otp = OTP;
          console.log(OTP);

          await sendOTPmail(req.body.fullname, req.body.email, OTP, res,req); // passing data as argument

          setTimeout(async () => {
            await Otp.findOneAndDelete({ emailId: bodyEmail });
          }, 60000);
        } else {
          res.redirect("/signup");
        }
      } else {
        req.flash("passflash", "password not match");
        res.redirect("/signup");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//  Function to Generator Otp :-

const generateOTP = () => {
  const digits = "0123456789";

  let OTP = "";

  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  return OTP;
};

// genarate token

const generateToken = () => {
  const digits = "0123456789";

  let token = "";

  for (let i = 0; i < 3; i++) {
    token += digits[Math.floor(Math.random() * 10)];
  }

  return token;
};
// sending  otp to mail

const sendOTPmail = async (username, email, sendOtp, res,req) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    }); 

    // compose email
    const mailOption = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "For Otp Verification",
      html: `<h3>Hello ${username},Welcome To AUDIX</h3> <br> <h4>Enter : ${sendOtp} on the OTP Box to register</h4>`,
    };

    //send mail
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log("Error sending mail :- ", error.message);
      } else {
        console.log("Email has been sended :- ", info.response);
      }
    });
    // otp schema adding
    const userOTP = await otp.create({
      emailId: email,
      otp: sendOtp,
    });


    const createdAt = Date.now();
    req.session.otpTime = createdAt
    res.redirect(`/verify?email=${email}&td=${createdAt}`);
  } catch (error) {
    console.log(error.message);
  }
};

const loadotpVerify = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    if (req.session.otp) {
      const token = req.query.tokenid || null;
      const queryemail = req.query.email;

      const flash = req.flash("flash");
      res.render("otp", { queryemail, msg: flash, listedCategory, token });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// verify the otp

const verifyOTP = async (req, res, next) => {
  try {
    const userSession = req.session.saveUser;
    const getQueryEmail = req.body.email;
    let enteredOTP =
      req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;
      
    const verifiedOTP = await otp.findOne({
      emailId: getQueryEmail,
      otp: enteredOTP,
    });

    if (getQueryEmail && req.body.token) {
      const forgetData = await otp.findOne({
        emailId: getQueryEmail,
        otp: enteredOTP,
        token: req.body.token,
      });
      if (forgetData) {
        res.redirect(`/passwordVerify?email=${getQueryEmail}`);
      } else {

        req.flash("flash", "Invalid OTP...!");
        res.redirect(
          `/verify?email=${getQueryEmail}&&tokenid=${req.body.token}&td=${createdAt}`
        );
      }
    } else {
      if (verifiedOTP) {
        if (userSession.email == getQueryEmail) {
          const hashpassword = await securepassword(
            req.session.saveUser.password
          );
          const userData = new User({
            fullname: req.session.saveUser.fullname,
            email: req.session.saveUser.email,
            phone: req.session.saveUser.phone,
            password: hashpassword,
            is_admin: 0,
            is_blocked: false,
          });
          userData.save();

          req.session.otp = undefined;

          await User.findByIdAndUpdate(
            { _id: userData._id },
            { $set: { is_verified: true } }
          );

          req.session.user = userData;

          req.flash("flash", "verified successfully");
          res.redirect("/verify");
        }
      } else {
       const createdAt = req.session.otpTime
        req.flash("flash", "Invalid OTP...!");
        res.redirect(`/verify?email=${getQueryEmail}&td=${createdAt}`);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

// resend -OTP

const resendOtp = async (req, res, next) => {
  try {
    const re_otpMail = req.query.email;
   
    const userDataa = req.session.saveUser;
   
    // const dataCheck = await User.findOne({email:re_otpMail})

    if (re_otpMail == userDataa.email) {
      const OTP = generateOTP();

      console.log(OTP + " Re-send otp");

      await sendOTPmail(userDataa.fullname, userDataa.email, OTP, res,req);

      setTimeout(async () => {
        await Otp.findOneAndDelete({ emailId: re_otpMail });
      }, 60000);
    }
  } catch (error) {
    console.log(error.message);
    next();
  }
};

// logout user
const logoutUser = async (req, res, next) => {
  try {
    req.session.user = undefined;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    next();
  }
};

const loadCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const categoryName = id.replace(/%20/g, " ");
    const listedCategory = await category.find({ is_listed: true });

    const product = await Products.aggregate([
      { $match: { status: true } },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },

      { $unwind: "$category" },

      { $match: { "category.name": categoryName } },
    ]);

    if (req.session.user) {
      res.render("category", {
        login: req.session.user,
        listedCategory,
        product,
      });
    } else {
      res.render("category", { listedCategory, product });
    }
  } catch (error) {
    next();
  }
};

// load products userSide

const loadProducts = async (req, res, next) => {
  try {
    const limit = 6;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const totaluserCount = await Products.countDocuments({ status: true });
    const totalPages = Math.ceil(totaluserCount / limit);

    const brands = await BrandsMod.find({});
    const listedCategory = await category.find({ is_listed: true });

    const products = await Products.find({ status: true })
      .populate("category")
      .skip(skip)
      .limit(limit);
    const product = products.filter((product) => product.category.is_listed);

    if (req.session.user) {
      const flash = req.flash("flash");
      res.render("products", {
        login: req.session.user,
        listedCategory,
        product,
        msg: flash,
        currentPage: page,
        totalPages,
        brands,
      });
    } else {
      res.render("products", {
        listedCategory,
        product,
        msg: flash,
        currentPage: page,
        totalPages,
        brands,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load contact
const loadContacts = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });

    if (req.session.user) {
      res.render("contact", { login: req.session.user, listedCategory });
    } else {
      res.render("contact", { listedCategory });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load about

const loadAbout = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });

    if (req.session.user) {
      res.render("about", { login: req.session.user, listedCategory });
    } else {
      res.render("about", { listedCategory });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const productView = async (req, res, next) => {
  try {
    const productId = req.query.id;
    const productDetails = await Products.findOne({ _id: productId }).populate(
      "category"
    );

    const listedCategory = await category.find({ is_listed: true });
    const related = await Products.find({category:productDetails.category})
   

    if (req.session.user) {
      res.render("productdetails", {
        login: req.session.user,
        listedCategory,
        productDetails,
      });
    } else {
      res.render("productdetails", { listedCategory, productDetails ,related});
    }
  } catch (error) {
    console.log(error);
    next();
  }
};

const wishlist = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });

    if (req.session.user) {
      const whishedProduct = await whishlist
        .findOne({ userId: req.session.user._id })
        .populate("products.productId");

      res.render("wishlist", {
        login: req.session.user,
        listedCategory,
        whishedProduct,
      });
    } else {
      res.render("wishlist", { listedCategory });
    }
  } catch (error) {}
};

const error404 = async (req, res) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    const errorMessage = req.query.message || "An error occurred";
    res.render("404", { listedCategory, errorMessage });
  } catch (error) {}
};

const Greeting = async (req, res, next) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    if (req.session.user) {
      res.render("greetings", { login: req.session.user, listedCategory });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error + "thanks");
  }
};

module.exports = {
  loadHome,
  loadlogin,
  verifylogin,
  loadsignup,
  insertUser,
  loadotpVerify,
  verifyOTP,
  logoutUser,
  resendOtp,
  loadCategory,
  loadProducts,
  loadContacts,
  loadAbout,
  productView,
  wishlist,
  loadforgot,
  passmatch,
  verifyforgot,
  passmatchsave,
  error404,
  Greeting,
};
