const mongoose=require("mongoose")


const brandSchema=new mongoose.Schema({
     brandName:{
          type:String,
          required:true
     },
     // isBlocked:{
     //      type:Boolean,
     //      default:false
     // },
     createdAt:{
          type:Date,
          default:Date.now
     },
     isDeleted:{
          type:Boolean,
          default:false
     }
})

const Brand=mongoose.model("Brand",brandSchema)

module.exports=Brand