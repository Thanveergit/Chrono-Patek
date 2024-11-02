const Wishlist=require("../../models/wishlistModel");
const User=require("../../models/userModel");
const Product=require("../../models/productModel");


const addToWishlist = async (req, res) => {
     try {
         const { productId } = req.body;
         console.log("Product ID:", productId);
         
         const product = await Product.findById(productId);
         if (!product) {
             return res.status(400).json({ success: false, message: "Product not found" });
         }
 
         const already = await Wishlist.findOne({ userId: req.session.user_id });
         if (!already) {
             // Create a new wishlist if none exists
             const wishlistItem = new Wishlist({
                 userId: req.session.user_id,
                 items: [{ productId: productId, price: product.offerPrice ? product.offerPrice : product.price }]
             });
             await wishlistItem.save();
             return res.status(200).json({ success: true, message: "Added to wishlist successfully" });
         } else {
             // Check if the product is already in the wishlist
             let flag = 0;
             already.items.forEach((item) => {
                 if (item.productId.toString() === productId) { 
                     flag = 1;
                 }
             });
 
             if (flag === 0) {
                 // Add product to the wishlist if it's not already there
                 await Wishlist.updateOne(
                     { userId: req.session.user_id },
                     {
                         $push: {
                             items: { productId: productId, price: product.offerPrice ? product.offerPrice : product.price }
                         }
                     }
                 );
                 return res.status(200).json({ success: true, message: "Added to wishlist successfully" });
             } else {
                 return res.status(400).json({ success: false, message: "Product already in wishlist" });
             }
         }
     } catch (error) {
         console.log("addToWishlist error:", error);
         return res.status(500).json({ success: false, message: "An error occurred" });
     }
 };
 

const loadWishlist=async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          const wishlist= await Wishlist.findOne({userId:req.session.user_id})
          .populate({
               path:"items.productId",
               model:"Product"
          })
          res.render("wishlist",{user:userData,wishlist:wishlist})
     } catch (error) {
          console.log(error)
     }
}

const removeFromWishlist=async(req,res)=>{
     try {
          const{productId}=req.params;
          const wishlist=await Wishlist.findOne({userId:req.session.user_id});

          if(!wishlist){
               return res.status(404).json({success:false,message:"Wishlist not found"});
          }

          const itemIndex=wishlist.items.findIndex(item=>item.productId.toString()===productId);

          if(itemIndex===-1){
               return res.status(400).json({success:false,message:"Product not found in the wishlist"});
          }

          wishlist.items.splice(itemIndex,1);
          await wishlist.save();

          return res.status(200).json({success:true,message:"Product removed from wishlist successfully"});
     } catch (error) {
        console.log("removeFromWishlist",error);  
     }
}
module.exports={
     loadWishlist,
     addToWishlist,
     removeFromWishlist,
}