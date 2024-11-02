const mongoose=require("mongoose")
const { defaultMaxListeners } = require("nodemailer/lib/xoauth2")


const categorySchema= new mongoose.Schema({
          name:{
          type:String,
          required:true,
          unique:true
     },
     isListed:{
          type:Boolean,
          default:true
     },
     createdAt:{
          type:Date,
          default:Date.now
     }
})

const Category=mongoose.model("Category",categorySchema)

module.exports=Category