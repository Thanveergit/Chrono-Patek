const mongoose=require("mongoose");

const categoryOfferSchema= mongoose.Schema({
     categoryId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"Category"
     },
     offerPercentage:{
          type:Number
     },
     expiryDate:{
          type:Date,
          index:{
               expires:0
          }
     }
})

const CategoryOffer= mongoose.model("CategoryOffer",categoryOfferSchema);

module.exports=CategoryOffer