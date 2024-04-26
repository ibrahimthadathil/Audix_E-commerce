const path = require("path");
const fs = require("fs");
const User = require("../../models/usermodel");
const Order = require("../../models/order");
const Products = require("../../models/product");
const { log } = require("console");

//load dashboard

const loadDashboard = async (req, res) => {
  try {
    const orderCount = await Order.find({}).populate("products.productId");
    const productCount = await Products.find();
    const totalSales = orderCount.reduce((acc, e) => acc + e.orderAmount, 0);
    const dmgProduct = productCount.reduce((acc, e) => acc + e.damagedStock, 0);
    const discount = orderCount.reduce((acc, e) => acc + e.discount, 0);
    const users = await User.find({}).countDocuments();
    const blockuser = await User.find({ is_blocked: true }).countDocuments();

    // top selling product
    const mostProduct = await Order.aggregate([
      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productId",
          totalcount: { $sum: "$products.quantity" },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $sort: { totalcount: -1 } },
      { $limit: 3 },
    ]);
    // top selling category
    const mostCate = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $group: {
          _id: "$categoryDetails._id",
          categoryName: { $first: "$categoryDetails.name" },
          totalCategoryQuantity: { $sum: "$totalQuantity" },
        },
      },
      { $sort: { totalCategoryQuantity: -1 } },
      { $limit: 3 },
    ]);
    // top selling brand
    const topBrand = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.productId",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $group: {
          _id: "$product.brand",
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    res.render("dashboard", {
      order: orderCount.length,
      totalSales,
      productCount,
      dmgProduct,
      mostProduct,
      mostCate,
      discount,
      users,
      blockuser,
      topBrand,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//  Year Chart (Put Method) :-

const chartYear = async (req, res) => {
  try {
    const curntYear = new Date().getFullYear();

    const yearChart = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(`${curntYear - 5}-01-01`),
            $lte: new Date(`${curntYear}-12-31`),
          },
        },
      },

      {
        $group: {
          _id: { $year: "$orderDate" },
          totalAmount: { $sum: "$orderAmount" },
        },
      },

      {
        $sort: { _id: 1 },
      },
    ]);

    res.send({ yearChart });
  } catch (err) {
    console.log(err.message);
  }
};

//  Month Chart (Put Method) :-

const monthChart = async (req, res) => {
  try {
    const monthName = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const curntYear = new Date().getFullYear();

    const monData = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(`${curntYear}-01-01`),
            $lte: new Date(`${curntYear}-12-31`),
          },
        },
      },

      {
        $group: {
          _id: { $month: "$orderDate" },
          totalAmount: { $sum: "$orderAmount" },
        },
      },

      {
        $sort: { _id: 1 },
      },
    ]);

    const salesData = Array.from({ length: 12 }, (_, i) => {
      const monthData = monData.find((item) => item._id === i + 1);

      return monthData ? monthData.totalAmount : 0;
    });

    res.json({ months: monthName, salesData });
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  loadDashboard,
  monthChart,
  chartYear,
};
