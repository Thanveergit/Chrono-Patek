const mongoose=require("mongoose");

const productOfferSchema=mongoose.Schema({
     productIds:[{
          type:mongoose.Schema.Types.ObjectId,
          ref:"Product",
     }],
     offerPercentage:{
          type:Number,
     },
     expiryDate:{
          type:Date,
          index:{
               expires:0
          }
     }
})

const ProudctOffer= mongoose.model("ProductOffer",productOfferSchema)

module.exports=ProudctOffer