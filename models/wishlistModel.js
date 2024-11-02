const mongoose=require("mongoose")


const wishlistSchema= new mongoose.Schema({
     userId:{
          type:mongoose.Schema.Types.ObjectId,
          required:true
     },
     items:[
          {
               productId:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Product",
                    required:true,
               }
          }
     ]
});

const Wishlist= mongoose.model("Whishlist",wishlistSchema);
module.exports=Wishlist