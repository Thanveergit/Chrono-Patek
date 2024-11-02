const Product=require("../../models/productModel");
const ProductOffer=require("../../models/productOfferModel");
const Category=require("../../models/categoryModel");
const CategoryOffer=require("../../models/categoryOfferModel");


//getting the loadProduct offer page
const loadProductOffer= async(req,res)=>{
     try {
          const page=Number(req.query.page) || 1;
          const limit=6;
          const skip=(page-1) * limit;
          //finding the active products
          const activeProducts= await Product.find({status:"active"});
          //finding the ProductOffers
          const productOffers= await ProductOffer.find()
          .populate("productIds")
          .skip(skip)
          .limit(limit)
          //counting the total productOffer
          const totalProductOffer= await ProductOffer.countDocuments();
          const totalPages= Math.ceil(totalProductOffer/limit);
          res.render("productOffers",{
               activeProducts,
               productOffers,
               totalPages,
               currentPage:page
          })
     } catch (error) {
          console.log("loadProductOffer",error);
          
     }
}

//add the productOffer
const addProductOffer = async (req, res) => {
     try {
         const { productIds, offerPercentage, expiryDate } = req.body;
 
         if (!Array.isArray(productIds) || productIds.length === 0) {
             return res.status(400).json({ success: false, message: "No product IDs provided." });
         }
 
         // Find or create the offer for these products
         let productOffer = await ProductOffer.findOne({ productIds: { $all: productIds } });
 
         if (!productOffer) {
             // If no existing offer, create a new one
             productOffer = new ProductOffer({
                 productIds,
                 offerPercentage,
                 expiryDate,
             });
         } else {
             // Update existing offer details
             productOffer.offerPercentage = offerPercentage;
             productOffer.expiryDate = expiryDate;
 
             // Add any new products to productIds array without duplicates
             productOffer.productIds = [...new Set([...productOffer.productIds, ...productIds])];
         }
 
         await productOffer.save();
 
         // Calculate and update offer price for each product
         const productsWithOffers = await Product.find({ _id: { $in: productIds } });
         await Promise.all(productsWithOffers.map(async (product) => {
             const offerPrice = product.price - (product.price * (offerPercentage / 100));
             product.offerPrice = offerPrice.toFixed(2); // Update offerPrice
             await product.save(); // Save the product with the new offerPrice
         }));
 
         res.status(200).json({ 
             success: true, 
             message: "Offer applied successfully to products.",
             products: productsWithOffers // Return the updated products
         });
     } catch (error) {
         console.log("addProductOffer Error:", error);
         res.status(500).json({ success: false, message: "Internal server error." });
     }
 };
 


//edit the ProductOffer
// const editProductOffer = async (req, res) => {
//      try {
//          // Getting elements using the query
//          const { offerPercentage, expiryDate, offerId, productId } = req.query; // Added productId
 
//          // Finding productOffer by offerId
//          const productOffer = await ProductOffer.findById(offerId);
 
//          // Editing the existing productOffer
//          if (productOffer) {
//              // Update offer percentage and expiry date
//              productOffer.offerPercentage = offerPercentage;
//              productOffer.expiryDate = new Date(expiryDate);
//              await productOffer.save();
 
//              // Find the specific product to update
//              const product = await Product.findById(productId);
//              if (product) {
//                  // Calculate and update the specific product's offerPrice
//                  const offerPrice = product.price - (product.price * (offerPercentage / 100));
//                  product.offerPrice = offerPrice.toFixed(2); // Update the offerPrice
//                  await product.save(); // Save the updated product
 
//                  res.status(200).json({ success: true, message: "Product Offer updated successfully for the specified product." });
//              } else {
//                  res.status(404).json({ success: false, message: "Product not found." });
//              }
//          } else {
//              res.status(404).json({ success: false, message: "Product Offer not found." });
//          }
//      } catch (error) {
//          console.log("editProductOffer", error);
//          res.status(500).json({ success: false, message: "Internal server error." });
//      }
//  };


const editProductOffer= async(req,res)=>{
     try {
          const {offerPercentage,offerId,expiryDate}=req.query;

          if(!offerId || !offerPercentage ||!expiryDate){
               return res.json({success:false,message:"Missing required fields:offerId,offerPercentage,expiryDate"});
          }

          const percentageNum=parseFloat(offerPercentage);
          if(isNaN(percentageNum)||percentageNum<0 || percentageNum>100){
               return res.json({success:false,message:"Invalid offerPercentage.Must be between 0 and 100"});
          }

          const productOffer= await ProductOffer.findById(offerId);
          if(!productOffer){
               return res.json({success:false,message:"Prodcut Offer not found"});
          }

          productOffer.offerPercentage=percentageNum;
          productOffer.expiryDate= new Date(expiryDate);
          await productOffer.save()

          const product= await Product.find({
               _id:{$in:productOffer.productIds}
          })

          if(product.length===0){
               return res.json({success:false,message:"No product found assoiciated with this offer."});
          }

          const updatedProducts= await Promise.all(product.map(async(product)=>{
               const offerPrice=product.price-(product.price * (percentageNum/100));
               product.offerPrice=offerPrice.toFixed(2);
               await product.save()
               return product;
          }));

          res.status(200).json({
               success:true,
               message:"product Offer updated successfully",
               data:{
                    offer:productOffer,
                    updatedProducts:updatedProducts
               }
          })
     } catch (error) {
          
          console.log("editProductOffer",error)
     }
}
 
//remove the productOffer
const removeProductOffer=async(req,res)=>{
     try {
          //removing the ProductOffer
          const offer= await ProductOffer.deleteOne({_id:req.query.id})
          res.json({success:true})
     } catch (error) {
          console.log("removeProductOffer",error);
     }
}


// // Getting the loadProduct offer page
// const loadProductOffer = async(req, res) => {
//      try {
//          const page = Number(req.query.page) || 1;
//          const limit = 6;
//          const skip = (page-1) * limit;
         
//          // Finding the active products
//          const activeProducts = await Product.find({ status: "active" });
         
//          // Finding the ProductOffers
//          const productOffers = await ProductOffer.find()
//              .populate("productId")
//              .skip(skip)
//              .limit(limit);
             
//          // Counting the total productOffer
//          const totalProductOffer = await ProductOffer.countDocuments();
//          const totalPages = Math.ceil(totalProductOffer/limit);
         
//          res.render("productOffers", {
//              activeProducts,
//              productOffers,
//              totalPages,
//              currentPage: page
//          });
//      } catch (error) {
//          console.log("loadProductOffer", error);
//          res.status(500).json({ success: false, message: "Internal server error" });
//      }
//  }
 
//  // Add the productOffer - Modified for multiple products
//  const addProductOffer = async(req, res) => {
//      try {
//          // Getting elements from the body part
//          const { productIds, offerPercentage, expiryDate } = req.body;
         
//          if (!Array.isArray(productIds) || productIds.length === 0) {
//              return res.status(400).json({ 
//                  success: false, 
//                  message: "No products selected" 
//              });
//          }
 
//          // Process each product
//          const results = await Promise.all(productIds.map(async (productId) => {
//              try {
//                  // Finding existing offer for the product
//                  let productOffer = await ProductOffer.findOne({ productId });
 
//                  if (!productOffer) {
//                      // Create new offer if doesn't exist
//                      productOffer = new ProductOffer({
//                          productId,
//                          offerPercentage,
//                          expiryDate,
//                      });
//                  } else {
//                      // Update existing offer
//                      productOffer.offerPercentage = offerPercentage;
//                      productOffer.expiryDate = expiryDate;
//                  }
 
//                  await productOffer.save();
//                  return { success: true, productId };
//              } catch (error) {
//                  return { success: false, productId, error: error.message };
//              }
//          }));
 
//          // Check if all operations were successful
//          const failedOperations = results.filter(result => !result.success);
         
//          if (failedOperations.length > 0) {
//              return res.status(207).json({
//                  success: false,
//                  message: "Some products failed to update",
//                  details: {
//                      successful: results.filter(r => r.success).length,
//                      failed: failedOperations
//                  }
//              });
//          }
 
//          res.status(200).json({
//              success: true,
//              message: `Successfully added offer to ${results.length} products`
//          });
 
//      } catch (error) {
//          console.log("addProductOffer", error);
//          res.status(500).json({
//              success: false,
//              message: "Failed to add product offers"
//          });
//      }
//  }
 
//  // Edit the ProductOffer - Modified for better error handling
//  const editProductOffer = async(req, res) => {
//      try {
//          const { offerPercentage, expiryDate, offerId } = req.query;
         
//          // Finding productOffer by offerId
//          const productOffer = await ProductOffer.findById(offerId);
         
//          // Editing the existing productOffer
//          if (productOffer) {
//              productOffer.offerPercentage = offerPercentage;
//              productOffer.expiryDate = new Date(expiryDate);
//              await productOffer.save();
//              res.status(200).json({
//                  success: true,
//                  message: "Product Offer updated successfully"
//              });
//          } else {
//              res.status(404).json({
//                  success: false,
//                  message: "Product Offer not found"
//              });
//          }
//      } catch (error) {
//          console.log("editProductOffer", error);
//          res.status(500).json({
//              success: false,
//              message: "Failed to edit product offer"
//          });
//      }
//  }
 
//  // Remove the productOffer - Modified for better error handling
//  const removeProductOffer = async(req, res) => {
//      try {
//          const result = await ProductOffer.deleteOne({ _id: req.query.id });
         
//          if (result.deletedCount === 1) {
//              res.json({
//                  success: true,
//                  message: "Product offer removed successfully"
//              });
//          } else {
//              res.status(404).json({
//                  success: false,
//                  message: "Product offer not found"
//              });
//          }
//      } catch (error) {
//          console.log("removeProductOffer", error);
//          res.status(500).json({
//              success: false,
//              message: "Failed to remove product offer"
//          });
//      }
//  }

//getting the categoryOffer page
const loadCategoryOffer=async(req,res)=>{
     try {
          const page=Number(req.query.page) || 1;
          const limit=6;
          const skip=(page - 1) * limit;
          //finding the listed categories
          const activeCategories= await Category.find({isListed:true});
          //finding the categoryOffers
          const categoryOffers= await CategoryOffer.find()
          .populate("categoryId")
          .limit(limit)
          .skip(skip)
          //counting the categoryOffer
          const totalCategoryOffer= await CategoryOffer.countDocuments();
          const totalPages=(totalCategoryOffer/limit)
          res.render("categoryOffers",{
               activeCategories,
               categoryOffers,
               totalPages,
               currentPage:page
          })
     } catch (error) {
          
     }
}

//add the categoryOffer
const addCategoryOffer=async(req,res)=>{
     try {
          //getting the elements from the body
          const {categoryId,offerPercentage,expiryDate}=req.body;
          //finding the categoryOffer by the categoryId
          let categoryOffer= await CategoryOffer.findOne({categoryId});
          //if categoryOffer doesnt exists , adding the categoryOffer
          if(!categoryOffer){
               categoryOffer= new CategoryOffer({
                    categoryId,
                    offerPercentage,
                    expiryDate,
               })
          }else{
               //assingning the offerPercentage to the categoryOffer
               categoryOffer.offerPercentage=offerPercentage;
               categoryOffer.expiryDate=expiryDate;
          }
          await categoryOffer.save();
          res.status(200).json({success:true,message:"Category Offer added successfully"});
     } catch (error) {
          console.log("addCategoryOffer",error)
     }
}

//edit the categoryOffer
const editCategoryOffer=async(req,res)=>{
     try {
          //getting the elements using the use of query
          const {offerId,offerPercentage,expiryDate}=req.query;
          //finding the categoryOffer by the offerId
          const categoryOffer= await CategoryOffer.findById(offerId);
          //editing the existing categoryOffer
          if(categoryOffer){
               categoryOffer.offerPercentage=offerPercentage;
               categoryOffer.expiryDate=new Date(expiryDate)
               await categoryOffer.save();
               res.status(200).json({success:true,message:"Category offer updated successfully"})
          }else{
               res.status(404).json({success:false,message:"Category offer not found"})
          }
     } catch (error) {
          console.log("editCategoryOffer",error);
     }
}

// remove the categoryOffer
const removeCategoryOffer= async(req,res)=>{
     try {
          //removing the categoryOffer
          const offer= await CategoryOffer.deleteOne({_id:req.query.id});
          res.json({success:true});
     } catch (error) {
          console.log("removeCategoryOffer",error);
     }
}


module.exports={
     loadProductOffer,
     addProductOffer,
     editProductOffer,
     removeProductOffer,
     loadCategoryOffer,
     addCategoryOffer,
     editCategoryOffer,
     removeCategoryOffer  
}