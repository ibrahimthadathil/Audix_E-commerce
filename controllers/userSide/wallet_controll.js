const User = require("../../models/usermodel");
const category = require("../../models/category");
const Wallet = require("../../models/wallet");
const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Products = require("../../models/product");
const Address = require("../../models/address");
const instance = require("../../config/razorpay");

// load wallet
const loadWallet = async (req, res) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    const availablebalance = await Wallet.findOne({
      userId: req.session.user._id,
    });
    const flash = req.flash("flash");
    if (req.session.user) {
      res.render("Profile/wallet", {
        login: req.session.user,
        listedCategory,
        availablebalance,
        msg: flash,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const walletUse = async (req, res) => {
  try {
    const { total, userid } = req.body;
    const Walltcheck = await Wallet.findOne({ userId: userid });
    if (Walltcheck) {
      if (Walltcheck.balance >= total) {
        const caart = await Cart.findOne({ userId: userid }).populate(
          "product.productId"
        );

        const addAddress = await Address.findOne(
          { userId: userid, "addresss.status": true },
          { "addresss.$": 1 }
        );

        let truepro;
        if (caart?.product) {
          const productStatus = caart.product.filter(
            (val) => val.productId.status === false || val.productId.stock <= 0
          );

          //  Product Status
          const falseproduct = await Cart.findOneAndUpdate(
            { userId: req.session.user._id },
            {
              $pull: {
                product: {
                  productId: { $in: productStatus.map((p) => p.productId._id) },
                },
              },
            },
            { new: true }
          ).populate("product.productId");

          truepro = falseproduct;
        }
        if (!caart || truepro.product.length == 0) {
          res.send({ emptycart: true });
        } else if (!addAddress) {
          res.send({ emptyaddress: true });
        } else {
          let count = 0;
          for (let i = 0; i < truepro.product.length; i++) {
            let cartCount = truepro.product[i].quantity;
            let productStock = truepro.product[i].productId.stock;

            if (cartCount > productStock) {
              res.send({ lowstock: true });
            } else {
              count++;
              if (count == truepro.product.length) {
                const productss = truepro.product;
                res.send({ approved: true });

                const { userName, name, city, state, phone, pincode } =
                  addAddress?.addresss?.[0] ?? {};

                let paymentMethod = req.body.peyment;

                const lastBalance = Walltcheck.balance - total;

                await Wallet.findOneAndUpdate(
                  { userId: userid },
                  {
                    $set: { balance: lastBalance },
                    $push: {
                      transaction: {
                        Amount: total,
                        Status: "Debit",
                        Source: "Wallet Purchase",
                      },
                    },
                  },
                  { upsert: true, new: true }
                );

                const orderConfirm = new Order({
                  UserId: req.session.user._id,
                  products: productss,

                  deliveryAddress: {
                    name: userName,
                    phone: phone,
                    place: name,
                    pincode: pincode,
                    state: state,
                    city: city,
                  },
                  orderDate: Date.now(),
                  orderAmount: caart.Total_price,
                  payment: paymentMethod,
                });
                const saveOrder = await orderConfirm.save();

                if (saveOrder) {
                  saveOrder.products.forEach(async (e) => {
                    let productt = await Products.findOne({ _id: e.productId });

                    let newStock = productt.stock - e.quantity;

                    await Products.findOneAndUpdate(
                      { _id: e.productId },
                      { $set: { stock: newStock } }
                    );
                  });

                  await Cart.findOneAndDelete({ userId: req.session.user._id });

                  res.redirect("/thanks");
                }
              }
            }
          }
        }
      } else {
        res.send({ lowfund: true });
      }
    } else {
      res.send({ notfound: true });
    }
  } catch (error) {
    console.log(error);
  }
};

// wallet recharge razor
const Recharge = async (req, res) => {
  try {
    const addMoney = Number(req.body.amt) * 100;
    const user = await User.findOne({ _id: req.session.user._id });

    const options = {
      amount: addMoney,
      currency: "INR",
      receipt: "absharameen625@gmail.com",
    };
    instance.orders.create(options, (err, order) => {
      if (!err) {
        res.send({
          success: true,
          msg: "Wallet updated ",
          amount: addMoney,
          key_id: process.env.RAZORPAY_IDKEY,
          name: user.name,
          email: user.email,
        });
      } else {
        console.error("Error Add money:", err);
        res.status(500).send({ success: false, msg: "Failed to topup" });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// add mmoney to wallet
const addMoney = async (req, res) => {
  try {
    const recharge = req.body.topup;
    const wallwtUpdate = await Wallet.findOneAndUpdate(
      { userId: req.session.user._id },
      {
        $inc: { balance: recharge },
        $push: {
          transaction: {
            Amount: recharge,
            Source: "Wallet topup",
            Status: "Credit",
          },
        },
      },
      { upsert: true, new: true }
    );
    req.flash("flash", "topup");
    res.redirect("/wallet");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadWallet,
  walletUse,
  Recharge,
  addMoney,
};
