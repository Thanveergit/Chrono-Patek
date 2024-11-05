const { session } = require("passport")
const User= require("../../models/userModel")
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
const env=require("dotenv").config()
const Product= require("../../models/productModel")
const productOffer=require("../../models/productOfferModel")
const Category=require("../../models/categoryModel")
const Brand=require("../../models/brandModel")
const Wallet=require("../../models/walletModel")
const categoryOffer = require("../../models/categoryOfferModel")

// hashing the password
const securePassword=async(password)=>{
     try{
          const passwordHash=await bcrypt.hash(password,10)
          return passwordHash
     }catch(error){
          console.log(error)
          res.status(500).send("Internal sever error")
     }
}


const offerPrice = async (products) => {
     try {
         let updatedProducts = [];
         
         const productOffers = await productOffer.find().populate("productIds");
         
         const categoryOffers = await categoryOffer.find().populate("categoryId");
        
 
         for (let product of products) {
             let productOfferMatch = false;
             let categoryOfferMatch = false;
             let productOfferPercentage = 0;
             let categoryOfferPercentage = 0;
 
             // Check for product-specific offer
          //    for (let offer of productOffers) {
          //        if (offer.productId._id.toString() === product._id.toString()) {
          //            productOfferMatch = true;
          //            productOfferPercentage = offer.offerPercentage;                     
          //            break;
          //        }
          //    }

               for(let offer of productOffers){
                    if(offer.productIds.some(id=>id._id.toString()===product._id.toString())){
                         productOfferMatch = true;
                         productOfferPercentage=offer.offerPercentage;
                         break;
                    }
               }
 
             // Check for category-specific offer
             for (let offer of categoryOffers) {
                 if (offer.categoryId._id.toString() === product.category._id.toString()) {
                     categoryOfferMatch = true;
                     categoryOfferPercentage = offer.offerPercentage;                    
                     break;
                 }
             }
 
             // Determine the applicable offer and update the product price
             if (productOfferMatch || categoryOfferMatch) {
                 let applicableOffer = Math.max(productOfferPercentage, categoryOfferPercentage);
                 product.offerPrice = Math.ceil(product.price - (product.price * applicableOffer) / 100);
             } else {
                 // No offer applicable, unset offerPrice
                 product.offerPrice = null;
                 
             }
 
             // Save the updated product to the database
             await Product.updateOne(
                 { _id: product._id },
                 { offerPrice: product.offerPrice }
             );
 
             updatedProducts.push(product);
         }
 
         return updatedProducts;
     } catch (error) {
         console.error("Error in offerPrice function:", error);
         return products; // Return the original products in case of an error
     }
 };
 
 
//load the home page 
const loadHome=async(req,res)=>{
     try{
          const referrarName=req.session.referrer_name || null;
          if(referrarName){
               console.log("referrerName in the home Page:",referrarName)
               req.session.referrer_name=null
          }
         
          const query = { status: "active", quantity: { $gt: 0 } };
         
          
          let  productData= await Product.find(query)
          .populate("category")
          .populate("brand")
          res.render("home",{
               products:productData,
               referrarName:referrarName
               
          })
          productData= await offerPrice(productData)
          

         
     }
     catch(error){
          console.log(error)
     }
}

// const clearReferrerl=async(req,res)=>{
//      try {
//           req.session.referrer_name=null;
//           res.json({success:true})
//      } catch (error) {
//           console.log("clearReferrerl",error)
//      }
// }

// load the sope page & and sorting the product 
const loadShope = async (req, res) => {
     try {
          // const page=parseInt(req.query.page) ||1;
          // const limit= 8;
          // const skip=(page-1) * limit
         const { sortOption,searchQuery='', minPrice = 0, maxPrice = Number.MAX_VALUE, selectedCategories = "", brandFilter = "" } = req.query;
 
         // Build the base query
         const query = { status: "active", quantity: { $gt: 0 } };
         
         if(searchQuery){
          query.productName={$regex:searchQuery, $options:'i'}
         }
 
         const minPriceInt = Number(minPrice);
         const maxPriceInt = Number(maxPrice);
 
         if (!isNaN(minPriceInt) && minPriceInt > 0) {
             query.price = { $gt: minPriceInt };
         }
         if (!isNaN(maxPriceInt) && maxPriceInt < Number.MAX_VALUE) {
             query.price = { ...query.price, $lte: maxPriceInt };
         }
 
         // Add category filtering to the query
         const categoryArray = selectedCategories.split(',').filter(Boolean);
         if (categoryArray.length > 0) {
             query.category = { $in: categoryArray };
         }
 
         // Add brand filtering to the query
         if (brandFilter && brandFilter !== "all") {
             query.brand = brandFilter;
         }
 
         // Sort logic
         let sort = {};
         switch (sortOption) {
             case "newArrival":
                 sort = { addedDate: -1 };
                 break;
             case "priceHighToLow":
                 sort = { price: -1 };
                 break;
             case "priceLowToHigh":
                 sort = { price: 1 };
                 break;
             case "nameAZ":
                 sort = { productName: 1 };
                 break;
             case "nameZA":
                 sort = { productName: -1 };
                 break;
             default:
                 sort = {};
                 break;
         }
         
         
         let  productData = await Product.find(query)
             .populate("category")
             .populate("brand")
             .sort(sort);

             productData= await offerPrice(productData)
 
         const totalProducts = await Product.countDocuments(query);
 
         const uniqueBrands = [];
         const seenBrands = new Set();
 
         productData.forEach(product => {
             if (product.brand && !seenBrands.has(product.brand.brandName)) {
                 uniqueBrands.push(product);
                 seenBrands.add(product.brand.brandName);
             }
         });
 
         const Categories = await Category.find({ isListed: true });
 
         // Render the page with filtered products
         res.render("shope", {
             products: productData,
             brands: uniqueBrands,
             Categories: Categories,
             sortOption: sortOption || "",
             minPrice: minPriceInt || 0,
             maxPrice: maxPriceInt || Number.MAX_VALUE,
             selectedCategories: selectedCategories.split(','),  
             selectedBrand: brandFilter  ,
             searchQuery:searchQuery,
         });
     } catch (error) {
         console.log(error);
     }
 };
 
 
 // load the about page
const loadAbout=async(req,res)=>{
     try{
          res.render("about")
     }catch(error){
          console.log(error)
     }
}

//load the contact page
const loadContact=async(req,res)=>{
     try{
          res.render("contact")
     }catch(error){
          console.log(error)
     }
}

//load the product page 
const loadProduct = async (req, res) => {
     try {
         const id = req.query.id;
         const userId = req.session.user_id;
 
         // Check for a valid product ID format (e.g., MongoDB ObjectId)
         if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
             return res.status(400).json( { message: "Invalid product ID." });
         }
 
         // Fetch user data
         const userData = await User.findOne({ _id: userId });
         
         // Fetch the product data with necessary checks
         const productData = await Product.findOne({ _id: id, status: "active" })
             .populate("category")
             .populate("brand");
 
         // Handle if product data is not found
         if (!productData) {
             return res.status(404).json( { message: "Product not found or inactive." });
         }
 
         // Fetch related products
         const relatedProducts = await Product.find({
             brand: productData.brand._id,
             _id: { $ne: id },
             status: "active"
         }).limit(4);
 
         // Render product page with data
         return res.render("product", {
             user: userData,
             product: productData,
             relatedProducts,
             stockQuantity: productData.quantity
         });
     } catch (error) {
         console.error("Error loading product:", error);
         return res.status(500).render("error", { message: "An unexpected error occurred. Please try again later." });
     }
 };
 
const loadLogin=async(req,res)=>{
     try{
          res.render("login")
     }catch(error){
          console.log(error)
     }
}
const loadSignup=async(req,res)=>{
     try{
          res.render("signup")
     }catch(error){
          console.log(error)
     }
}

const loadOtp=async(req,res)=>{
     try{
          res.render("otp")
     }catch(error){
          console.log(error)
     }
}

const googleAuthentication = async (accessToken, refreshToken, profile, done) => {
     console.log(profile)
     try {
         // Check if the user already exists in the database by Google ID
         let user = await User.findOne({ googleId: profile.id });
         console.log("hkfhkjhsakd",user)
         console.log("gfkdjh",req.session.user);
 
         if (!user) {
             // If user is not found by Google ID, check by email
             user = await User.findOne({ email: profile.emails[0].value });
          
 
             if (!user) {
                 // If user is not found by email either, create a new user
                 user = new User({
                     googleId: profile.id,
                     name: profile.displayName,
                     email: profile.emails[0].value,
                     profilePicture: profile.photos[0].value,
                     isGoogleAuth: true
                 });
                 await user.save();
             } else {
                 // If user is found by email but without Google ID, update with Google ID
                 if (!user.googleId) {
                     user.googleId = profile.id;
                     user.isGoogleAuth = true;
                     await user.save();
                 }
             }
         }
        
         return done(null, user); // Return the existing or new user
     } catch (error) {
         console.error("Error during Google Authentication:", error);
         return done(error, null);
     }
 }; 

function generateOtp(){
     return Math.floor(100000 + Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp){
     try{
          const transporter=nodemailer.createTransport({
               service:"gmail",
               port:587,
               secure:false,
               requireTLS:true,
               auth:{
                    user:process.env.NODMAILER_EMAIL,
                    pass:process.env.NODMAILER_PASSWORD 
               }
          })
          const info= await transporter.sendMail({
               from:process.env.NODMAILER_EMAIL,
               to:email,
               subject:"Verify your account",
               text:`your OTP is ${otp}`,
               html:`<b> your OTP: ${otp}</b>`
          })
          return info.accepted.length>0
     }catch(error){
          console.error("error sending email",error)
          return false;
     }
}


const generateReferralCode = () => {
     return Math.random().toString(36).substring(2, 8).toUpperCase(); // Generates a 6-character code
 };

const signup = async (req, res) => {
     try {
         const { name, phone, email, password,referralCode} = req.body;
         
         // Check if the user already exists
         const findUser = await User.findOne({ email });
         if (findUser) {
             return res.render("signup", { message: "User with this email already exists." });
         }
 
         let referrar=null;
         if(referralCode){
          referrar= await User.findOne({referralCode});
          if(!referrar){
               
               return res.render("signup",{message:"Invalid refferal code"});
          }
         }
         // Generate OTP
         const otp = generateOtp();
         
 
         // Send verification email
         const emailSent = await sendVerificationEmail(email, otp);
         if (!emailSent) {
             
             return res.render("signup", { message: "Error sending verification email. Please try again later." });
         }
 
         // Save OTP and user data to the session
         req.session.userOtp = otp;
         req.session.userData = { name, phone, email, password,referralCode,referrar };
         
         console.log("otp send",otp)
         // Redirect to OTP verification page
         return res.render("otp", { message: "OTP sent to your email. Please verify." });
 
     } catch (error) {
         console.error("Signup error:", error);
        
     }
 };

 const verifyOtp=async(req,res)=>{
     try{
          const {otp}=req.body
          console.log(otp)

          if(otp===req.session.userOtp){
               const user= req.session.userData
               const passwordHash= await securePassword(user.password)

               const saveUserData=new User({
                    name:user.name,
                    email:user.email,
                    phone:user.phone,
                    password:passwordHash,
                    referralCode:generateReferralCode(),
                    referredBy:user.referrar?user.referrar._id:null,

               })
               await saveUserData.save();

               if(user.referrar){
                    await User.updateOne({_id:user.referrar._id},{$inc:{referralCount:1}})
                    console.log("user.referrar",user)
                    
                    const bonusAmount=200;
                    const referralWallet= await Wallet.findOne({userId:user.referrar._id});
                    

                    if(!referralWallet){
                         await Wallet.create({
                              userId:user.referrar._id,
                              balance:bonusAmount,
                              history:[{
                                   amount:bonusAmount,
                                   transactionType:"bonus",
                                   newBalace:bonusAmount,
                                   transactionAmount:bonusAmount
                              }],
                         });
                    }else{
                         await Wallet.findOneAndUpdate(
                              {userId:user.referrar._id},
                              {
                                   $inc:{balance: bonusAmount},
                                   $push:{
                                        history:{
                                             amount:bonusAmount,
                                             transactionType:"bonus",
                                             newBalace:referralWallet.balance+bonusAmount,
                                             transactionAmount:bonusAmount,
                                        },
                                   },
                              }
                         );
                    }
                    console.log("referrar wallet:",referralWallet)
               }
               req.session.user=saveUserData._id;
               res.json({success:true,redirectUrl:"/login"})
          }else{
               res.status(400).json({success:false, message:"Invalid OTP, Please try again"})
          }
     }catch(error){
          console.error("Error verifieng OTP",error)
          
     }
 }
 
 const resendotp=async(req,res)=>{
     try{
          const {email}=req.session.userData;
          if(!email){
               res.status(400).json({success:false, message:"Email not found in session"})
          }
          const otp=generateOtp()
          req.session.userOtp=otp
          
          const emailSent= await sendVerificationEmail(email,otp)

          if(emailSent){
               console.log("Resend OTP:",otp)
               res.status(200).json({success:true, message:"OTP Resend Successfully"})
          }else{
               res.status(500).json({success:false, message:"Faild to resend OTP. Please try again"})
          }
     }catch(error){
          console.log("Error resending OTP:",error)
          
     }
 }

 
 const verifyLogin = async (req, res) => {
     const { email, password } = req.body;
     try {
     
         const userData = await User.findOne({ isAdmin: 0, email: email });
         
         if (userData) {
             if (userData.isBlocked) {
                 return res.render("login", { message: "Your account is blocked by the admin." });
             }
 
             const isPasswordMatch = await bcrypt.compare(password, userData.password);
             if (isPasswordMatch) {
                 req.session.user_id = userData._id;
                 req.session.user_name = userData.name;
                 
                 if(userData.referredBy){
                    const referrer= await User.findById(userData.referredBy)
                    if(referrer){
                         req.session.referrer_name=referrer.name;
                         console.log("referrer name:",req.session.referrer_name)
                    }
                 }
                 
                 return res.redirect("/");
             } else {
                 return res.render("login", { message: "Invalid password" });
             }
         } else {
             return res.render("login", { message: "User not found" });
         }
     } catch (error) {
         console.error("Login error:", error);
     //     return res.render("login", { message: "Login failed. Please try again later." });
     }
 };
 
 const logout=async(req,res)=>{
     try{
          req.session.destroy()
          res.redirect("/")
     }catch(error){
          console.log(error)
          
     }

 }


 
module.exports={
     loadHome,
     loadShope,
     loadAbout,
     loadContact,
     loadProduct,
     loadLogin,
     loadSignup,
     loadOtp,
     googleAuthentication,
     verifyLogin,
     logout,
     signup,
     verifyOtp,
     resendotp,
     offerPrice,
     // clearReferrerl
     // referrarName
}