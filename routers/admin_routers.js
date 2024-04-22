const express = require ('express')
const path = require('path')
const admin_routers = express ()

// setting admin view 
admin_routers.set('view engine','ejs')
admin_routers.set('views','./views/Admin')


// middlewear

const admin_auth = require ('../middleware/admin_auth')

//__________________ requiring admin controll 

const admin_controll = require('../controllers/admincontroller')

//_________________________ requiring category

const category_controll = require('../controllers/categorycontroller')

// _______________________requiring product

const product_controll = require ('../controllers/product_controller')

//_______________________require Admin order

const admin_order = require('../controllers/adminOrder')

//______________________________require Admin coupon

const coupon_controller = require ( '../controllers/adminSide/coupon_controller')

//_______________require admin offer

const offer_controller = require ('../controllers/adminSide/offerController')

// _____________________admin dashboard

const dashboard_controller =  require ('../controllers/adminSide/dasboard_controller')

//_____________________sales report 

const report_controller = require ('../controllers/adminSide/sales_report')

// showing the login page 

admin_routers.get('/',admin_auth.islogout,admin_controll.loadLogin)

// post body request

admin_routers.post('/',admin_controll.verifyAdmin)

// load dashboard

// admin_routers.get('/dashboard',admin_auth.islogin,admin_controll.loadDashboard)

// load users
admin_routers.get('/users',admin_auth.islogin,admin_controll.loadUsers)

admin_routers.get('/users/:id',admin_controll.userAction)

// load orders 
admin_routers.get('/orders',admin_auth.islogin,admin_controll.loadOrders)


// load category

admin_routers.get('/category',admin_auth.islogin,admin_controll.adminCategory)

// admin logout 

admin_routers.post('/logout',admin_auth.islogin,admin_controll.adminLogout)




//__________________ category routes


admin_routers.post('/category',category_controll.addCategory)

// edit category

admin_routers.put('/category',category_controll.editCategory)

// category action

admin_routers.put('/categoryaction',category_controll.cateAction)

// _________________add brand

admin_routers.post('/addBrands',category_controll.addBrand)



//____________________ add products 

const multer=require('multer');
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

    cb(null, path.join(__dirname, '../public/product_Images'));
     },

      filename: (req, file, cb) => {

    const name = Date.now() + ' - ' + file.originalname;

    cb(null, name);

     },

    });

const upload = multer({

  storage: storage,
  fileFilter: (req, file, cb) => {

    cb(null, true);

  },

});

  

// load products

admin_routers.get('/products',admin_auth.islogin,product_controll.loadProducts)

// add products (Get)

admin_routers.get('/productsAdd',admin_auth.islogin,product_controll.loadAddproduct)

// add products (post)

admin_routers.post('/productsAdd',upload.array('images', 3),product_controll.addProducts)

// edit product 
admin_routers.get('/editProduct',admin_auth.islogin,product_controll.loadeditProduct)

//product list 

admin_routers.put('/productStatus',product_controll.productStatus)

// product Edit

admin_routers.post('/productedit/:id',upload.fields([{ name: 'image0', maxCount: 1 },{ name: 'image1', maxCount: 1 },{ name: 'image2', maxCount: 1 }]),product_controll.editProduct)

// order details

admin_routers.get('/orderDtails',admin_order.ordersDetails)

// order handle

admin_routers.put('/orderStatusHandling',admin_order.orderProstatus)

// coupon get method 

admin_routers.get('/coupons',admin_auth.islogin,coupon_controller.Admincoupon)

// coupon create 

admin_routers.post('/addcoupons',upload.array('image',1),coupon_controller.addcoupon)

// coupon action

admin_routers.put('/coupenActions/:id',coupon_controller.statusAction  )

admin_routers.put('/deletecoupon/:id',coupon_controller.deleteCoupon)

//__________offer

admin_routers.get('/offer',admin_auth.islogin,offer_controller.offerload)

// offer post 

admin_routers.post('/offeradd',offer_controller.offerAdd)

//remove offer 

admin_routers.put('/removeoffer/:id',offer_controller.removeoff)

//_______dashboard 

// load dashboard 

admin_routers.get('/dashboard',admin_auth.islogin,dashboard_controller.loadDashboard)


// _____________sales report 

admin_routers.get('/salesReports/:id', admin_auth.islogin, report_controller.loadReport);

// custom report 

admin_routers.put('/customReport',report_controller.customReport)


//  Year Chart (put)
admin_routers.put('/chartYear', dashboard_controller.chartYear);

//  Month Chart (put)
admin_routers.put('/monthChart', dashboard_controller.monthChart);


module.exports =  admin_routers