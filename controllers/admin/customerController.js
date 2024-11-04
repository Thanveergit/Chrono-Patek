const User=require("../../models/userModel")



// getting the users details
const usersDetails= async(req,res)=>{
     try{
          let search=""
          if(req.query.search){
               search=req.query.search
          }
          let page=1
          if(req.query.page){
               page=req.query.page
          }
          const limit=6
          const userData= await User.find({
               isAdmin:false,
               $or:[

                    {name:{$regex:".*"+search+".*"}},
                    {email:{$regex:".*"+search+".*"}}
               ]
          
          })
          .limit(limit*1)
          .skip((page-1)*limit)
          .exec()

          const count= await User.find({
               isAdmin:false,
               $or:[

                    {name:{$regex:".*"+search+".*"}},
                    {email:{$regex:".*"+search+".*"}}
               ]
          }).countDocuments()
          const totalPages = Math.ceil(count / limit);

          res.render("users",{searchQuery:search,data:userData,totalPages:totalPages,currentPage:page})
     }catch(error){

     }
}

//blocking the users
const userBlocked = async (req, res) => {
     try {
       let id = req.body.id; 
       await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
       
       res.redirect('/admin/users'); 
     } catch (error) {
       console.error(error);
       res.status(500).json({ success: false, message: "Internal server error" });
     }
   };
   
   //unblocking the users
   const userUnblocked = async (req, res) => {
     try {
       let id = req.body.id; 
       await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
       
       res.redirect('/admin/users');
     } catch (error) {
       console.error(error);
       res.status(500).json({ success: false, message: "Internal server error" });
     }
   };
   

module.exports={
     usersDetails,
     userBlocked,
     userUnblocked
}