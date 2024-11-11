const express = require("express");
const passport = require("passport");
const userRouter = express.Router(); 
const userController = require("../controllers/user/userController");
const cartController= require("../controllers/user/cartController");
const orderController=require("../controllers/user/orderController");
const profileController=require("../controllers/user/profileController");
const couponController=require("../controllers/admin/couponController");
const wishlistController=require("../controllers/user/wishlistController");
const walletController=require("../controllers/user/walletController");
const  userAuth= require('../middlewares/userAuth');
const { use } = require("bcrypt/promises");
const Cart=require("../models/cartModel");
const Wishlist=require("../models/wishlistModel");


//for showing the cart count 
const cartCountMiddleware= async(req,res,next)=>{
  try {
    if(req.session.user_id){
      const cartData= await Cart.findOne({userId:req.session.user_id});
      let cartCount=0;
      if(cartData){
        cartCount=cartData.items.length;
      }
      res.locals.cartCount=cartCount;
    }else{
      res.locals.cartCount=0;
    }
  } catch (error) {
    console.log("cartCountMiddleware",error);
    res.locals.cartCount=0
  }
  next();
};

//for showing the wishlist count
const wishlistCountMiddleware = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
      let wishlistCount = 0;
      let wishlistItems = [];

      if (wishlist) {
        wishlistCount = wishlist.items.length;
        wishlistItems = wishlist.items.map(item => item.productId.toString());
      }

      // Store wishlist count and items in locals
      res.locals.wishlistCount = wishlistCount;
      res.locals.wishlistItems = wishlistItems; 
      req.session.wishlistItems = wishlistItems;  
    } else {
      res.locals.wishlistCount = 0;
      res.locals.wishlistItems = []; 
      req.session.wishlistItems = [];
    }
  } catch (error) {
    console.log("wishlistCountMiddleware", error);
    res.locals.wishlistCount = 0;
    res.locals.wishlistItems = []; 
  }
  next();
};


// storing for the user id
const userMiddleware= (req,res,next)=>{
  if(req.session.user_id){
    res.locals.user={
      id:req.session.user_id,
    };
  }else{
    res.locals.user=null
  }
  next()
};

const setTitleMiddleware=(req,res,next)=>{
  const routeTitleMap={
    "/":"Home",
    "/shope":"shop",
    "/cart":"cart",
    "/wishlist":"wishlist",
    "/order-success":"orderSuccess",
    "/profile":"profile",
    "/viewOrders":"MyOrders",
    "/order-details":"OrderDetails",
    "/checkout":"Checkout",
    "/wallet":"Wallet",
    "/login":"Login",
    "/signup":"SignUp",
    "/otp":"Otp",
    "/address":"Address",
    "/editAddress":"EditAddress",
    "/editPassword":"ChangePassword",
    "/product":"Product",
  }
  res.locals.title=routeTitleMap[req.path] || "default title";
  next()
}

userRouter.use(setTitleMiddleware)
userRouter.use(wishlistCountMiddleware)
userRouter.use(cartCountMiddleware)
userRouter.use(userMiddleware);

// Define your application routes
userRouter.get('/', userController.loadHome);
// userRouter.post("/clear-referral",userController.clearReferrerl)
userRouter.get('/shope', userController.loadShope);
userRouter.get("/about", userController.loadAbout);
userRouter.get("/contact", userController.loadContact);

// cart management
userRouter.get("/cart",userAuth.isLogin,cartController.loadCart);
userRouter.post("/add-to-cart",userAuth.isLogin,cartController.addToCart);
userRouter.delete("/cart/remove",userAuth.isLogin,cartController.removeFromCart);
userRouter.post("/cart/decrement",userAuth.isLogin,cartController.decrementCart);
userRouter.post("/cart/increment",userAuth.isLogin,cartController.incrementCart);


//checkout management
userRouter.get("/checkout",userAuth.isLogin,cartController.loadCheckout);
userRouter.post("/checkout/add-new-address",userAuth.isLogin,cartController.addNewAddress);
userRouter.post("/apply-discount",userAuth.isLogin,orderController.applyDiscount)
userRouter.post("/verify-and-place-order",userAuth.isLogin,orderController.verifyPaymentAndPlaceOrder)
userRouter.post("/remove-coupon",userAuth.isLogin,orderController.removeCoupon)


//coupon management
userRouter.get("/check-coupon",userAuth.isLogin,couponController.couponCheck);
//order management
userRouter.post("/checkout/place-order",userAuth.isLogin,orderController.creatOrder);
userRouter.get("/order-success",userAuth.isLogin,orderController.orderSuccess);
userRouter.get("/viewOrders",userAuth.isLogin,orderController.viewOrder);
userRouter.get("/order-details",userAuth.isLogin,orderController.orderDetails);
userRouter.post("/cancelOrder",userAuth.isLogin,orderController.cancelOrder);
userRouter.post("/returnProduct",userAuth.isLogin,orderController.returnProduct);
userRouter.get("/order-failed",orderController.orderFailed)
userRouter.post("/update-order-status",orderController.updateOrderStatus)
userRouter.post("/retry-payment",userAuth.isLogin,orderController.retryPayment)


//profile management
userRouter.get("/profile",userAuth.isLogin,profileController.profile)
userRouter.post("/editProfile",userAuth.isLogin,profileController.editProfile)

//address management 
userRouter.get("/address",userAuth.isLogin,profileController.loadAddress);
userRouter.post("/addAddress",userAuth.isLogin,profileController.addAddress);
userRouter.get("/editAddress",userAuth.isLogin,profileController.loadEditAddress);
userRouter.post("/editAddress",userAuth.isLogin,profileController.editAddress);
userRouter.post("/removeAddress",userAuth.isLogin,profileController.removeAddress);

//password management
userRouter.get('/editPassword',userAuth.isLogin,profileController.loadEditPassword)
userRouter.post("/changePassword",userAuth.isLogin,profileController.changePassword)

//wishlist management
userRouter.get("/wishlist",userAuth.isLogin,wishlistController.loadWishlist)
userRouter.post("/addToWishlist",userAuth.isLogin,wishlistController.addToWishlist)
userRouter.delete("/removeFromWishlist/:productId",userAuth.isLogin,wishlistController.removeFromWishlist)

//wallet management
userRouter.get("/wallet",userAuth.isLogin,walletController.loadWallet);
userRouter.post("/wallet/addFunds",userAuth.isLogin,walletController.addFunds);
userRouter.post("/wallet/verifyPayment",userAuth.isLogin,walletController.verifyPayment);

//login management
userRouter.get("/login", userController.loadLogin);
userRouter.post("/login",userController.verifyLogin)
userRouter.get("/signup", userController.loadSignup);
userRouter.post("/signup",userController.signup)
userRouter.post("/otp",userController.verifyOtp)
userRouter.get("/otp", userController.loadOtp);
userRouter.post("/resend-otp",userController.resendotp)
userRouter.get("/logout",userController.logout);

//single product management
userRouter.get("/product", userController.loadProduct);



// Google Authentication Routes
userRouter.get(
     "/auth/google",
     passport.authenticate("google", { scope: ["profile", "email"] })
   );
   
   userRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      console.log('user:', req.user);
      req.session.user_id = req.user.id; 
      console.log(req.session.user_id)
      req.session.isAuthenticated = true;
      res.redirect("/"); 
    }
  );
  
  

module.exports = userRouter;
