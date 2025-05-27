const User = require("../models/usermodel");
const Address = require("../models/address");
const Product = require("../models/product");
const Category = require("../models/category");
const Cart = require("../models/cart");
const Order = require("../models/order");
const instance = require("../config/razorpay");
const Wallet = require("../models/wallet");
const wallet = require("../models/wallet");
const product = require("../models/product");
require("dotenv").config();


// load Order
const loadOrder = async (req, res) => {
  try {
    const limit = 3;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const totalCatCount = await Order.find({
      UserId: req.session.user._id,
    }).countDocuments();
    const totalPages = Math.ceil(totalCatCount / limit);
    const listedCategory = await Category.find({ is_listed: true });
    if (req.session.user) {
      const userAddress = await Address.findOne({
        userId: req.session.user._id,
      });
      const orderData = await Order.find({ UserId: req.session.user._id })
        .skip(skip)
        .limit(limit);
      res.render("Profile/orders", {
        listedCategory,
        login: req.session.user,
        userAddress,
        orderData,
        currentPage: page,
        totalPages,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message, "    loadorder");
  }
};

const orderplace = async (req, res) => {
  try {
    let truepro;
    const caart = await Cart.findOne({ userId: req.session.user._id }).populate(
      "product.productId"
    );

    const addAddress = await Address.findOne(
      { userId: req.session.user._id, "addresss.status": true },
      { "addresss.$": 1 }
    );
    if (caart?.product) {
      const proStatus = caart.product.filter(
        (val) => val.productId.status === false || val.productId.stock <= 0
      );
      //  Product Status
      const falseproduct = await Cart.findOneAndUpdate(
        { userId: req.session.user._id },
        {
          $pull: {
            product: {
              productId: { $in: proStatus.map((p) => p.productId._id) },
            },
          },
        },
        { new: true }
      ).populate("product.productId");
      truepro = falseproduct;
    }

    if (!caart || truepro.product.length == 0) {
      req.flash("flash", "no cart");
      res.redirect("/checkout");
    } else if (!addAddress) {
      req.flash("flash", "Please Add your address..!");
      res.redirect("/checkout");
    } else {
      let count = 0;
      for (let i = 0; i < truepro.product.length; i++) {
        let cartCount = truepro.product[i].quantity;
        let productStock = truepro.product[i].productId.stock;

        if (cartCount > productStock) {
          req.flash("flash", "lowstock");
          res.redirect("/checkout");
        } else {
          count++;
          if (count == truepro.product.length) {
            const productss = truepro.product;

            const { userName, name, city, state, phone, pincode } =
              addAddress?.addresss?.[0] ?? {};

            let paymentMethod = req.body.peyment;

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
              discount: caart.couponDiscount,
              discountRate: caart.discountRate,
            });
            const saveOrder = await orderConfirm.save();

            if (saveOrder) {
              saveOrder.products.forEach(async (e) => {
                let productt = await Product.findOne({ _id: e.productId });

                let newStock = productt.stock - e.quantity;

                await Product.findOneAndUpdate(
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
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  try {
    if (req.session.user) {
      const listedCategory = await Category.find({ is_listed: true });
      const order = await Order.findOne({ _id: req.query.id }).populate(
        "products.productId"
      );

      res.render("Profile/orderDetails", {
        login: req.session.user,
        order,
        listedCategory,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//razor
const razor = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const cartCheck = await Cart.findOne({
      userId: req.session.user._id,
    }).populate("product.productId");

    const addAddress = await Address.findOne(
      { userId: req.session.user._id, "addresss.status": true },
      { "addresss.$": 1 }
    );
    if (!cartCheck || cartCheck.product.length <= 0) {
      res.send({ emptycart: true });
    } else if (!addAddress) {
      res.send({ emptyaddress: true });
    } else {
      const amount = req.body.amount * 100;
      const options = {
        amount: amount,
        currency: "INR",
        receipt: "absharameen625@gmail.com",
      };
      instance.orders.create(options, (err, order) => {
        if (!err) {
          res.send({
            succes: true,
            msg: "ORDER created",
            order_id: order.id,
            amount: amount,
            key_id: process.env.RAZORPAY_IDKEY,
            name: user.name,
            email: user.email,
          });
        } else {
          console.error("Error creating order:", err);
          res
            .status(500)
            .send({ success: false, msg: "Failed to create order" });
        }
      });
    }
  } catch (err) {
    console.log(err.message + "     razor");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { cancelproduct, cancelorder } = req.body;

    const cancelItem = await Order.findOneAndUpdate(
      { _id: cancelorder, "products.productId": cancelproduct },
      { $set: { "products.$.orderProStatus": "canceled" } },
      { new: true }
    );

    let canceledProduct;

    if (cancelItem) {
      canceledProduct = cancelItem.products.find((product) =>
        product.productId.equals(cancelproduct)
      );

      await Product.findOneAndUpdate(
        { _id: canceledProduct.productId },
        { $inc: { stock: canceledProduct.quantity } }
      );

      let updatedOrderAmount = cancelItem.products
        .filter((product) => product.orderProStatus !== "canceled")
        .reduce((total, product) => total + product.price, 0);

      if (cancelItem.discountRate > 0) {
        updatedOrderAmount = Math.floor(
          updatedOrderAmount -
            (updatedOrderAmount * cancelItem.discountRate) / 100
        );
      }

      await Order.findByIdAndUpdate(
        { _id: cancelorder },
        { $set: { orderAmount: updatedOrderAmount } },
        { new: true }
      );
      res.send({ canceled: true });
    }

    let totalbalance;
    if (cancelItem.payment != "Cash on delivery") {
      const balace = await Wallet.findOne({ userId: req.session.user._id });

      if (balace) {
        totalbalance = canceledProduct.price;
      } else {
        totalbalance = canceledProduct.price;
      }

      if (cancelItem.discount > 0) {
        totalbalance = Math.floor(
          canceledProduct.price -
            (canceledProduct.price * cancelItem.discountRate) / 100
        );
      }

      await wallet.findOneAndUpdate(
        { userId: req.session.user._id },
        {
          $inc: { balance: totalbalance },
          $push: {
            transaction: {
              Amount: totalbalance,
              Status: "Credit",
              Source: "Canceled Product",
            },
          },
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};

const returnProduct = async (req, res) => {
  try {
    const { orId, proId, reason } = req.body;

    const returnedItem = await Order.findOneAndUpdate(
      { _id: orId, "products.productId": proId },
      {
        $set: {
          "products.$.orderProStatus": "return",
          "products.$.orderReason": reason,
        },
      },
      { new: true }
    );
    if (returnedItem) {
      res.send({ updated: true });
      const returnedproduct = returnedItem.products.find((product) =>
        product.productId.equals(proId)
      );
      if (returnedproduct.orderReason == "Product Damaged") {
        await product.findOneAndUpdate(
          { _id: returnedproduct.productId },
          { $inc: { damagedStock: returnedproduct.quantity } }
        );
      } else {
        await Product.findOneAndUpdate(
          { _id: returnedproduct.productId },
          { $inc: { stock: returnedproduct.quantity } }
        );
      }
      let updatedOrderAmount = returnedItem.products
        .filter(
          (product) =>
            product.orderProStatus != "return" &&
            product.orderProStatus != "canceled"
        )
        .reduce((acc, elem) => acc + elem.price, 0);

      if (returnedItem.discountRate > 0) {
        updatedOrderAmount = Math.floor(
          updatedOrderAmount -
            (updatedOrderAmount * returnedItem.discountRate) / 100
        );
      }
      await Order.findOneAndUpdate(
        { _id: orId },
        { $set: { orderAmount: updatedOrderAmount } }
      );

      let diductPrice;

      if (returnedItem.discount > 0) {
        diductPrice = Math.floor(
          returnedproduct.price -
            (returnedproduct.price * returnedItem.discountRate) / 100
        );
        console.log(diductPrice);
      }

      await Wallet.findOneAndUpdate(
        { userId: req.session.user._id },
        {
          $inc: { balance: diductPrice },
          $push: {
            transaction: {
              Amount: diductPrice,
              Status: "Credit",
              Source: "Product Return",
            },
          },
        },
        { upsert: true, new: true }
      ); // adding he return amount
    }
  } catch (error) {
    console.log(error.message);
  }
};

const invoiced = async (req, res) => {
  try {
    if (req.session.user) {
      const invoicedata = await Order.find({ _id: req.params.id }).populate(
        "products.productId UserId"
      );
      const currentDate = new Date()
        .toString()
        .split(" ")
        .slice(0, 4)
        .join("  ");
      res.render("Profile/invoice", { invoicedata, currentDate });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const failedPayment = async (req , res ) => {
  try {
    const addAddress = await Address.findOne(
      { userId: req.session.user._id, "addresss.status": true },
      { "addresss.$": 1 }
    );
    const caart = await Cart.findOne({ userId: req.session.user._id }).populate(
      "product.productId"
    );
    const { userName, name, city, state, phone, pincode } =
              addAddress?.addresss?.[0] ?? {};

            let paymentMethod = req.body.peyment;

            const orderConfirm = new Order({

              UserId: req.session.user._id,

              products: caart.product.map((elem) => ({

                productId:elem.productId,
                price:elem.price,
                quantity:elem.quantity,
                orderProStatus : 'payment failed',

              })),

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
              discount: caart.couponDiscount,
              discountRate: caart.discountRate,
            });
            const saveOrderr = await orderConfirm.save();

            if(saveOrderr){

              res.redirect('/orders')

            }

  } catch (error) {
    console.log(error);
  }
}
module.exports = {
  loadOrder,
  orderplace,
  orderDetails,
  razor,
  cancelOrder,
  returnProduct,
  invoiced,
  failedPayment
};
