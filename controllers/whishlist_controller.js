const whishlist = require("../models/whishlist");
const User = require("../models/usermodel");
const Products = require("../models/product");
const Cart = require("../models/cart");
// add product into whishlist
const addWhishlist = async (req, res) => {
  try {
    if (req.session.user) {
      const exist = await whishlist.findOne({
        userId: req.session.user._id,
        products: { $elemMatch: { productId: req.params.id } },
      });
      if (!exist) {
        await whishlist.findOneAndUpdate(
          { userId: req.session.user._id },
          { $addToSet: { products: { productId: req.params.id } } },
          { new: true, upsert: true }
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
// delete whishlikst

const deleteWhish = async (req, res) => {
  try {
    await whishlist.findOneAndUpdate(
      { userId: req.session.user._id },
      { $pull: { products: { productId: req.params.id } } }
    );
    res.send({ removed: true });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  addWhishlist,
  deleteWhish,
};
