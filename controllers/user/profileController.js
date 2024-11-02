const User=require("../../models/userModel");
const Address=require("../../models/addressModel");
const bcrypt=require("bcrypt");

//getting the profile page 
const profile= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          res.render("profile",{user:userData});
     } catch (error) {
          console.log("profile",error);

     }
}

//edit the profile
const editProfile= async(req,res)=>{
     const userId=req.session.user_id;

     const {name,phone}=req.body;
     try {
          const updateUser= await User.findByIdAndUpdate(userId,{name,phone},{new:true});
          
          if(!updateUser){
               return res.status(404).json({error:"user not found"});
          }
          return res.redirect("/profile");
     } catch (error) {
          console.log("editProfile",error);
     }
}

//getting the address page
const loadAddress= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          const addressData= await Address.findOne({userId:req.session.user_id});

          res.render("address",{user:userData,addresses:addressData ? addressData.address:[]})
     } catch (error) {
          console.log("address",error);
     }
}

//adding the address
const addAddress= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          let address= await Address.findOne({userId:userData._id});
          if(!address){
               address=new Address({
                    userId:userData._id,
                    address:[]
               })
          }
          const {name,state,district,phone,pincode,house,city}=req.body;
          address.address.push({
               name,
               phone,
               address,
               state,
               pincode,
               house,
               district,
               phone,
               city,
          })
          await address.save();
          res.status(200).json({message:"address added successfully",address});

     } catch (error) {
        console.log("add address",error);  
     }
}

//getting the edit adderss page
const loadEditAddress= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          const addressId=req.query.addressId;
          console.log(addressId)
          const address= await Address.findOne({userId:req.session.user_id});
          res.render("editAddress",{
               user:userData,
               address:address.address.find(a=>a._id.toString()=== addressId)
          });
     } catch (error) {
          console.log(" load edit address",error);
     }
}

//editing the address
const editAddress=async(req,res)=>{
     try {
          const addressId= req.body.addressId;
          let address= await Address.findOne({'address._id':addressId});
          if(!address){
               return res.status(404).json({error:"Address not found"});
          }

          const index= address.address.findIndex(a=>a._id.toString()===addressId);
          const {name,phone,district,city,house,state,pincode}=req.body;

          address.address[index].name=name;
          address.address[index].phone=phone;
          address.address[index].district=district;
          address.address[index].state=state;
          address.address[index].house=house;
          address.address[index].pincode=pincode;
          address.address[index].city=city;

          await address.save();
          res.status(200).json({message:"Address added successfully",address:address[index]});


     } catch (error) {
          console.log("edit address",error);
     }
}

//remove the address
const removeAddress= async(req,res)=>{
     try {
          const {addressId}=req.body;
          const result= await Address.updateOne(
               {'address._id':addressId},
               {$pull:{address:{_id:addressId}}}
          );
          if(result.nModified==0){
               return res.status(404).json({error:"Address not found"});

          }
          res.status(200).json({message:"address removed successfully"});
     } catch (error) {
          console.log("remove address",error);
     }
}


//hashing the password
const hashPassword= async(password)=>{
     try {
          const passwordHash= await bcrypt.hash(password,10);
          return passwordHash;
     } catch (error) {
          console.log(error);
     }
     
}

//getting the edit password page
const loadEditPassword= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          res.render("editPassword",{user:userData});
     } catch (error) {
          console.log(error)
     }
}

//editing the password
const changePassword= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          if(userData){
               const passwordMatch= await bcrypt.compare(req.body.currentPassword,userData.password);
               if(passwordMatch){
               const hashedPassword= await hashPassword(req.body.newPassword)
               userData.password=hashedPassword;
               await userData.save();
               return res.json({success:true});
          }else{
               return res.status(400).json({message:"Entered old password is wrong"});
          }
      }else{
          return res.status(404).json({message:"User not found"});

      }
          
     } catch (error) {
          console.log(error)
     }
}


module.exports={
     profile,
     loadAddress,
     addAddress,
     editProfile,
     loadEditAddress,
     editAddress,
     removeAddress,
     loadEditPassword,
     changePassword,
}
