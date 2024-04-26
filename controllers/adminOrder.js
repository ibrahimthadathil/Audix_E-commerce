const Admin = require("../models/usermodel");

const Orders = require("../models/order");

const ordersDetails = async (req, res) => {
  try {
    const orderId = req.query.id;

    const orderDetails = await Orders.findOne({ _id: orderId }).populate(
      "products.productId UserId"
    );

    res.render("orderDetails", { orderDetails });
  } catch (error) {
    console.log(error.message);
  }
};
// order status change func
// const updateOrderStatus = async (orderId) => {

//     try {

//         const order = await Orders.findById(orderId);

//         const orderProStatusValues = order.products.map((item) => item.orderProStatus);

//         let newOrderStatus;

//         if (orderProStatusValues.every((status) => status === "delivered")) {

//             newOrderStatus = "delivered";

//         } else if (orderProStatusValues.every((status) => status === "shipped")) {

//             newOrderStatus = "shipped";

//         } else if (orderProStatusValues.every((status) => status === "canceled")) {

//             newOrderStatus = "canceled";

//         } else {

//             newOrderStatus = "pending";

//         }

//         order.orderStatus = newOrderStatus;

//         await order.save();

//     } catch (err) {

//         console.log(err.message + " updateOrderStatus");

//     }

// };
// order handle put
const orderProstatus = async (req, res) => {
  try {
    const orderId = req.body.ordId;
    const productId = req.body.proId;
    const bodyValue = req.body.val;

    await Orders.findOneAndUpdate(
      { _id: orderId, "products.productId": productId },

      { $set: { "products.$.orderProStatus": bodyValue } }
    );

    // updateOrderStatus(orderId);

    res.json({ success: true });
  } catch (err) {
    console.log(err.message + " orderProstatus");
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  ordersDetails,
  orderProstatus,
};
