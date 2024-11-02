const { MongoServerClosedError } = require("mongodb");
const mongoose= require("mongoose");

const orderSchema= new mongoose.Schema({
     orderId:{
          type:String,
          required:true,
     },
     userId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"User",
          required:true,
     },
     totalPrice:{
          type:Number,
          required:true,
     },
     items:[
          {
          productId:{
               type:mongoose.Schema.Types.ObjectId,
               required:true,
               ref:"Product",
          },
          productName:{
               type:String,
               required:true,
          },
          categoryName:{
               type:String,
               required:true,
          },
          brandName:{
               type:String,
               required:true
          },
          image:{
               type:String,
          },
          itemStatus:{
               type:String,
               required:true,
               default:"Ordered"
          },
          price:{
               type:Number,
               required:true
          },
          quantity:{
               type:String,
               required:true,
          },
          finalPrice:{
               type:Number,
               required:true
          },
          reason:{
               type:String,

          },
          isApproved:{
               type:Boolean
          }
     }
],
     address:{
          name:{
               type:String,
          },
          phone:{
               type:String,
          },
          house:{
               type:String
          },
          state:{
               type:String
          },
          pincode:{
               type:String
          },
          district:{
               type:String
          },
          city:{
               type:String
          }
     },
     paymentMethod:{
          type:String,
          required:true
     },
     paymentStatus:{
          type:String,
          required:true,
     },
     status:{
          type:String,
          required:true,
          default:'Pending'
     },
     discount:{
          couponId:{
               type:mongoose.Schema.Types.ObjectId,
               ref:"Coupon"
          },
          discountAmount:{
               type:Number,
               default:0,
          }
     },
     date:{
          type:Date,
          default:Date.now,
          required:true,
     }
});

const Order= mongoose.model("Order",orderSchema);

module.exports=Order