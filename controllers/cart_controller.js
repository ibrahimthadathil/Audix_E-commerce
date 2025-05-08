const Cart = require("../models/cart");
const category = require("../models/category");
const PRODUCTS = require("../models/product");
const User = require("../models/usermodel");
const whishlist = require("../models/whishlist");
const Wishlist = require("../models/whishlist");

// load cart

const cart = async (req, res) => {
  try {
    const listedCategory = await category.find({ is_listed: true });
    const userdata = await User.findById({ _id: req.session.user._id });

    if (req.session.user) {
      const userProduct = await Cart.findOne({
        userId: req.session.user._id,
      }).populate("product.productId");

      if (userProduct) {
        for (let product of userProduct.product) {
          if (!product.productId.status || product.productId.stock <= 0) {
            product.price = 0;
          }
        }

        const cartData = await Cart.findOne({
          userId: req.session.user._id,
        }).populate("product.productId");
        const totalPrice = userProduct.product.reduce(
          (acc, product) => acc + product.price,
          0
        );
        let afterCoupon = totalPrice;

        if (cartData.product.length <= 0) {
          await Cart.findOneAndUpdate(
            { _id: cartData._id },
            { $set: { couponDiscount: 0 } }
          );
        }
        if (userProduct.couponDiscount > 0) {
          afterCoupon = totalPrice - userProduct.couponDiscount;
        }

        const updatedCart = await Cart.findOneAndUpdate(
          { userId: req.session.user._id },
          { $set: { Total_price: afterCoupon } },
          { new: true, upsert: true }
        );

        res.render("cart", {
          login: req.session.user,
          listedCategory,
          userProduct,
          userdata,
          totalprice: updatedCart.Total_price,
          cartData,
        });
      } else {
        res.render("cart", {
          login: req.session.user,
          listedCategory,
          totalprice: 0,
          cartData:[]
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).send("Internal Server Error");
  }
};

// cart add
const addCart = async (req, res) => {
  try {
    if (req.session.user) {
      const qty = req.body.qty || 1;

      const cartProduct = await PRODUCTS.findOne({ _id: req.params.id });
      const exist = await Cart.findOne({
        userId: req.session.user._id,
        product: { $elemMatch: { productId: req.params.id } },
      });

      if (!exist) {
        const total =
          cartProduct.discount > 0
            ? cartProduct.discout_price * qty
            : cartProduct.price * qty;

        const cartupdate = await Cart.findOneAndUpdate(
          { userId: req.session.user },
          {
            $addToSet: {
              product: {
                productId: req.params.id,
                quantity: qty,
                price: total,
              },
            },
          },
          { new: true, upsert: true }
        );

        const wishlistUpdate = await Wishlist.findOneAndUpdate(
          { userId: req.session.user._id },
          { $pull: { products: { productId: req.params.id } } },
          { new: true }
        );
        res.send({ success: true });
      } else {
        res.send({ exist: true });
      }
    } else {
      res.send({ failed: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCart = async (req, res) => {
  try {
    const user = req.session.user._id;
    const cartItem = req.params.id;
    const remove = await Cart.findOneAndUpdate(
      { userId: user },
      { $pull: { product: { productId: cartItem } } }
    );
    res.send({ seleted: true });
  } catch (error) {
    console.log(error.message);
  }
};
//edit cart fetch
const cartEdit = async (req, res) => {
  try {
    const product = await PRODUCTS.findOne({ _id: req.body.i });
    const newval =
      product.discount > 0
        ? product.discout_price * req.body.quantity
        : product.price * req.body.quantity;

    if (!product.status) {
      newPrice = 0;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { _id: req.body.id, "product.productId": req.body.i },
      {
        $set: {
          "product.$.price": newval,
          "product.$.quantity": req.body.quantity,
        },
      },
      { new: true }
    );

    const total = updatedCart.product.reduce(
      (acc, product) => acc + product.price,
      0
    );

    const pricce = await Cart.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { Total_price: total } }
    );

    res.send({ success: total });
  } catch (err) {
    console.log(err.message + "   cart edit ");
  }
};

// cart Count
const cartCount = async (req, res) => {
  try {
    if (req.session.user) {
      const findItem = await Cart.findOne({ userId: req.session.user._id });

      const count = findItem?.product.length || 0;

      res.send({ success: count });
    } else {
      res.send({ success: 0 });
    }
  } catch (error) {
    console.log(error.message + "cartcount");
  }
};

module.exports = {
  cart,
  addCart,
  deleteCart,
  cartEdit,
  cartCount,
};
