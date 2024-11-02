const express = require("express")
const admin_router=express.Router()
const customerController= require("../controllers/admin/customerController")
const adminAuth=require("../middlewares/adminAuth")
const adminController=require("../controllers/admin/adminController")
const categoryController=require("../controllers/admin/categoryController")
const brandController=require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController")
const couponController=require("../controllers/admin/couponController")
const offerController=require("../controllers/admin/offerController")
const uploads=require("../helpers/multer")

//login management
admin_router.get("/login",adminController.loadLogin)
admin_router.post("/login",adminController.verifyLogin);
admin_router.get("/",adminAuth,adminController.loadDashboard)
admin_router.get("/logout",adminController.logout)

//user management
admin_router.get("/users",adminAuth,customerController.usersDetails)
admin_router.post("/blockUser", adminAuth, customerController.userBlocked);
admin_router.post("/unblockUser", adminAuth, customerController.userUnblocked);


//catagory management
admin_router.get("/category", adminAuth, categoryController.categoryDetails);
admin_router.get("/addCategory", adminAuth, categoryController.addCategory);
admin_router.post("/addNewCategory",adminAuth,categoryController.addNewCategory)
admin_router.post("/listCategory", adminAuth, categoryController.listCategory);
admin_router.post("/unListCategory", adminAuth, categoryController.unListCategory);
admin_router.post("/editCategory/:id", adminAuth, categoryController.updateCategory);



//brand management
admin_router.get("/brands",adminAuth,brandController.getBrand)
admin_router.post("/brands",adminAuth,brandController.addBrand)
admin_router.post("/deleteBrand",adminAuth,brandController.deleteBrand)
admin_router.post("/restoreBrand",adminAuth,brandController.restoreBrand)

//product managment
admin_router.get("/products",adminAuth,productController.loadProduct)
admin_router.get("/addProducts",adminAuth,productController.loadAddProducts)
admin_router.post("/addProducts",adminAuth,uploads.any(),productController.addProducts)
admin_router.post("/listProduct/",adminAuth,productController.listProduct)
admin_router.post("/unListProduct",adminAuth,productController.unListProduct)
admin_router.get("/editProduct",adminAuth,productController.loadEditProduct)
admin_router.post("/editProduct",adminAuth,uploads.fields([
     {name:"image1",maxCount:1},
     {name:"image2",maxCount:1},
     {name:"image3",maxCount:1}
     
]),productController.editProduct)

//order management 
admin_router.get("/orders",adminAuth,adminController.loadOrders);
admin_router.get("/orderDetails",adminAuth,adminController.AdminOrderDetails)
admin_router.post("/updateOrderStatus",adminAuth,adminController.updateOrderStatus);
admin_router.post("/returnApproval",adminAuth,adminController.approvalForReturnProduct)

//coupon management
admin_router.get("/coupons",adminAuth,couponController.loadCoupon);
admin_router.post("/coupons/add",adminAuth,couponController.addCoupon);
admin_router.put("/coupons/edit",adminAuth,couponController.editCoupon);
admin_router.delete("/coupons/delete",adminAuth,couponController.deleteCoupon);

// productOffer management
admin_router.get("/productOffers",adminAuth,offerController.loadProductOffer);
admin_router.post("/addProductOffer",adminAuth,offerController.addProductOffer);
admin_router.post("/editProductOffer",adminAuth,offerController.editProductOffer);
admin_router.delete("/removeProductOffer",adminAuth,offerController.removeProductOffer);

//categoryOffer management
admin_router.get("/categoryOffers",adminAuth,offerController.loadCategoryOffer);
admin_router.post("/addCategoryOffer",adminAuth,offerController.addCategoryOffer);
admin_router.post("/editCategoryOffer",adminAuth,offerController.editCategoryOffer);
admin_router.delete("/removeCategoryOffer",adminAuth,offerController.removeCategoryOffer);

//salesReport management

admin_router.get("/salesReport",adminAuth,adminController.loadSalesReport);
admin_router.get("/filterInterval",adminAuth,adminController.filterInterval);
admin_router.get("/filter",adminAuth,adminController.filterReport)

module.exports=admin_router