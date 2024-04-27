const User = require("../models/usermodel");
const Address = require("../models/address");
const category = require("../models/category");
const Cart = require("../models/cart");
const couponModel = require('../models/coupons')

//load checkout

const loadcheckout = async (req, res) => {
  const listedCategory = await category.find({ is_listed: true });
  const availableCoupon = await couponModel.find({status:true})
 

  if (req.session.user) {
    const userdata = await User.findById({ _id: req.session.user._id });

    const userProduct = await Cart.findOne({
      userId: req.session.user._id,
    }).populate("product.productId");

    if (userProduct) {
      for (let product of userProduct.product) {
        if (!product.productId.status || product.productId.stock <= 0) {
          product.price = 0;
        }
      }
      const totalPrice = userProduct.product.reduce(
        (acc, product) => acc + product.price,
        0
      );
      let he;
      if (userProduct.couponDiscount > 0) {
        he = totalPrice - userProduct.couponDiscount;
      }
      const cartData = await Cart.findOneAndUpdate(
        { userId: req.session.user._id },
        { $set: { Total_price: he } },
        { new: true, upsert: true }
      ).populate("product.productId");
      const addressList =
        (await Address.findOne({ userId: req.session.user._id })) || null;

      const flash = req.flash("flash");

      res.render("checkout", {
        listedCategory,
        login: req.session.user,
        userdata,
        addressList,
        cartData,
        msg: flash,
        availableCoupon
      });
    } else {
      const addressList =
        (await Address.findOne({ userId: req.session.user._id })) || null;
      const flash = req.flash("flash");
      res.render("checkout", {
        listedCategory,
        login: req.session.user,
        userdata,
        cartData: 0,
        addressList,
        msg: flash,
        availableCoupon
      });
    }
  } else {
    res.redirect("/login");
  }
};

const addAddresscheckout = async (req, res) => {
  try {
    const user = req.query.id;
    const getAddress = req.body.address;
    const exist = await Address.findOne({
      userId: user,
      addresss: { $elemMatch: { name: getAddress.address } },
    });

    if (!exist) {
      const newAddress = await Address.findOneAndUpdate(
        { userId: user },
        {
          $addToSet: {
            addresss: {
              userName: req.session.user.fullname,
              name: getAddress.address,
              city: getAddress.city,
              state: getAddress.state,
              phone: getAddress.phone,
              pincode: getAddress.pincode,
              status: true,
            },
          },
        },
        { new: true, upsert: true }
      );

      if (newAddress) {
        res.send({ success: true });
      }
    } else {
      res.status(400).send({ failed: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const chooseAddress = async (req, res) => {
  try {
    const addres = req.query.id;
    const userId = req.session.user._id;

    const update = await Address.bulkWrite([
      {
        updateOne: {
          filter: { userId: userId, "addresss.status": true },
          update: { $set: { "addresss.$.status": false } },
        },
      },
      {
        updateOne: {
          filter: { userId: userId, "addresss._id": addres },
          update: { $set: { "addresss.$.status": true } },
        },
      },
    ]);
  } catch (error) {
    console.log(error.message);
  }
};
// edit checkout
const editCheckout = async (req, res) => {
  try {
    const dataId = req.body.input;
    const Editdata = await Address.findOne(
      { "addresss._id": dataId },
      { "addresss.$": 1 }
    );
    res.json({ Editdata });
  } catch (error) {
    console.log(error.message);
  }
};

const updateAddresscheckout = async (req, res) => {
  try {
    const user = req.session.user._id;
    const { address, city, state, pincode, phone, id } = req.body;
    const updatedata = await Address.findOneAndUpdate(
      { userId: user, "addresss._id": id },
      {
        $set: {
          "addresss.$.name": address,
          "addresss.$.city": city,
          "addresss.$.state": state,
          "addresss.$.pincode": pincode,
          "addresss.$.phone": phone,
        },
      }
    );

    if (updatedata) {
      req.flash("flash", "success");
      res.redirect("/checkout");
    } else {
      req.flash("flash", "failed");
      res.redirect("/checkout");
    }
  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
  loadcheckout,
  addAddresscheckout,
  chooseAddress,
  editCheckout,
  updateAddresscheckout,
};
