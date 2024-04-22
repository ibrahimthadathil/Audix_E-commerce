const category = require("../models/category");
const Products = require("../models/product");
const Brand = require("../models/Brand");
const fs = require("fs");
const path = require("path");
const { findOne } = require("../models/usermodel");
const { Console, log } = require("console");

// load products adminSide

const loadProducts = async (req, res) => {
  try {
    const limit = 5;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const totalCatCount = await Products.countDocuments();
    const totalPages = Math.ceil(totalCatCount / limit);

    const productsData = await Products.find({}).populate("category")
      .skip(skip)
      .limit(limit);

    res.render("products", { currentPage: page, totalPages, productsData });
  } catch (error) {
    console.log(error.message);
  }
};

// add products get

const loadAddproduct = async (req, res) => {
  try {
    const listcategory = await category.find({ is_listed: true });
    const brands = await Brand.find();

    res.render("productadd", { listcategory, brands });
  } catch (error) {
    console.log(error.message);
  }
}; 

// add producrts post
 
const addProducts = async (req, res) => {
  try {
    const price = req.body.price;
    let images = [];
    const image = req.files;

    image.forEach((file) => {
      images.push(file.filename);
    });
    const deductedprice = Math.round((price / 100) * (100 - req.body.Discountprice));
    

    const currentDate = Date();
    const categories = await category.findOne({ name: req.body.category });
    const brands = await Brand.findOne({ name: req.body.brand });

    const product = Products.create({
      name: req.body.product,
      price: req.body.price,
      stock: req.body.stock,
      category: categories._id,
      image: images,
      brand: brands.name,
      description: req.body.description,
      discout_price: deductedprice,
      discount: req.body.Discountprice,
      createdAt: currentDate,
      status: req.body.radio,
    });

    res.redirect("/admin/products");
  } catch (error) {}
};
//show edit product edit

const loadeditProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const productsData = await Products.findById({ _id: productId });

    res.render("productEdit", { productsData });
  } catch (error) {}
};

// product list
const productStatus = async (req, res) => {
  try {
    const productId = req.query.id;
    const productStatus = await Products.findOne({ _id: productId });
    productStatus.status = !productStatus.status;
    productStatus.save();
    res.send({ set: true });
  } catch (error) {
    throw error;
  }
};

// edit product

const editProduct = async (req, res) => {
  try {


    const produt = await Products.findOne({ _id: req.params.id });
    const { product, price, Discountprice, stock, description } = req.body;
    const deductedprice = Math.round((price / 100) * (100 - Discountprice));
    
    
    let imag = [];

    for (let i = 0; i < 3; i++) {
      const key = `k${i}`;
      if (req.body[key]) {
        imag.push(produt.image[i]);
      } else {
        imag.push(req.files[`image${i}`][0].filename);
        fs.unlinkSync(
          path.join(__dirname, "../public/product_Images", produt.image[i])
        );
      }
    }
    produt.image = imag;
    await Products.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          name: product,
          price: price,
          discount:Discountprice,
          discout_price: deductedprice,
          stock: stock,
          description: description,
          image: imag,
        },
      }
    );
    produt.save();
    res.redirect('/admin/products')
  } catch (error) {}
};

// searchproduct
const searchProduct = async (req, res) => {
  try {
    const findProduct = req.body.items
    const searchedItem = await Products.find({ name: { $regex: new RegExp(`.*${findProduct}.*`, 'i') } }).populate('category');

    
    res.send(searchedItem);
    
  } catch (error) {}
};
const  priceFilter = async ( req , res ) => {
  try {
      const {low,high} =req.body
    if(low&&high) {
          const item = await Products.find({$and:[{price:{$gt:Number(low)}},{price:{$lte:Number(high)}}]}).populate('category')
      if(item) {
          res.send({cards:item})
        }else{
          res.send({status:'failed'})
        }
    }else{
          res.send({status:'failed'})
    }
  
      }catch (error) {
  
      }
  }

 // Ascending filter
 
 const Ascend = async (req , res)=>{
  try {
    const statuss =req.body.status
    if(statuss){
      const ascend =await Products.find({status:true}).sort({name:1}).populate('category')
      res.send(ascend)
    }
  } catch (error) {
    
  }
 }
 // ascending priceFilter
 const priceAscend = async (req , res ) => {
  try {
  
    const statuss =req.body.status
    if(statuss){
      const ascend =await Products.find({status:true}).sort({price:1}).populate('category')
      res.send(ascend)
    }
  } catch (error) {
    
  }
 }
module.exports = {
  loadProducts,
  addProducts,
  loadAddproduct,
  loadeditProduct,
  productStatus,
  editProduct,
  searchProduct,
  priceFilter,
  Ascend,
  priceAscend
};
