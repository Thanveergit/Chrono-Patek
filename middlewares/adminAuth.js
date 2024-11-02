const User= require("../models/userModel")


const adminAuth = (req, res, next) => {
     // console.log("Admin session data:", req.session);
     if (req.session && req.session.admin) {
       next();
     } else {
       res.redirect("/admin/login");
     }
   };
   

// const adminAuth=(req,res,next)=>{
//      User.findOne({isAdmin:true})
//      .then(data=>{
//           if(data){
//                next()
//           }else{
//                res.redirect("/admin/login")
//           }
//      })
//      .catch(error=>{
//           console.log("Error in adminAuth middleware",error)
//           res.status(500).send("Internal server error")
//      })
// }

module.exports=adminAuth