const mongoose=require("mongoose");

const walletShcema=  mongoose.Schema({
     userId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"User",
          required:true
     },
     balance:{
          type:Number,
          default:0,
     },
     history:[
          {
               date:{
                    type:Date,
                    default:Date.now
               },
               amount:{
                    type:Number,
               },
               transactionType:{
                    type:String,
               },
               newBalance:{
                    type:Number,
               },
               transactionAmount:{
                    type:Number
               },
          }
     ]
})

const Wallet=new mongoose.model("Wallet",walletShcema);

module.exports=Wallet