const fs = require('fs');
const easyinvoice = require('easyinvoice');

const data = (det) => {
    const products = det.products.map((e, i) => {  return (
        {
        description: e.productId.name,
        quantity: e.quantity,
        price: e.productId.price,
        total:e.price
    })});
    const obj = {
        mode: "development",
        images: {
            logo: "",
        },
        sender: {
            company: "Audix",
            state: 'kerala',
            zip:871976,
            city: 'kochi',
            country: "india"
        },
        client: {
            company: det.UserId.fullname,
            address: det.deliveryAddress.place,
            zip: det.deliveryAddress.pincode,
            city: det.deliveryAddress.city,
            state: det.deliveryAddress.state,
            country: "india"
        },
        information: {
            number: det._id,
            date: det.orderDate,
        },
        products: products,
        bottomNotice: "thank you for purchasing",
        settings: {
            currency: "USD",
        },
        translate: {}
    };

    return obj;
};

module.exports = data;