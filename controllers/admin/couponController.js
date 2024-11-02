const Coupon=require("../../models/couponModel");



//getting the coupon page
const loadCoupon=async(req,res)=>{
     try {
          const page=Number(req.query.page) || 1;
          const limit=6;
          const skip=(page - 1) * limit;

          const coupons= await Coupon.find()
          .sort({addedDate:-1})
          .skip(skip)
          .limit(limit);


          const totalCoupons= await Coupon.countDocuments();
          const totalPages=Math.ceil(totalCoupons/limit);

          res.render("coupon",{
               coupons,
               totalPages,
               currentPage:page,
          })
     } catch (error) {
          console.log("coupon",error);
     }
}

//add the coupon
const addCoupon=async(req,res)=>{
     try {
          const {couponCode,percentage,minPrice,maxRedeemAmount,expiryDate}=req.body;

          let coupon= await Coupon.findOne({couponCode:couponCode});
          if(!coupon){
               coupon= new Coupon({
                    couponCode,
                    percentage,
                    minPrice,
                    maxRedeemAmount,
                    expiryDate,
               })
               await coupon.save()
               return res.status(200).json({message:"Coupon added successfully.."});
          }else{
               return res.status(400).json({message:"Coupon code already exists.."});
          }
     } catch (error) {
          console.log("addCoupon",error)
     }
}


//edit the coupon
const editCoupon= async(req,res)=>{
     try {
          const {couponCode,percentage,minPrice,maxRedeemAmount,expiryDate}=req.body;

          await Coupon.updateOne(
               {_id:req.query.id},
               {
                    $set:{
                         couponCode,
                         percentage,
                         minPrice,
                         maxRedeemAmount,
                         expiryDate
                    }
               }
          )
          return res.status(200).json({message:"Coupon added successfully.."})
     } catch (error) {
         console.log("editCoupon",error); 
     }
}

//delete the coupon
const deleteCoupon= async(req,res)=>{
     try {
          const couponId= req.query.couponId;
          await Coupon.deleteOne({_id:couponId});
          res.json({success:true});
     } catch (error) {
          console.log("deleteCoupon",error);
     }
}


//check the coupon
const couponCheck = async (req, res) => {
  try {
    const { couponId, totalPrice } = req.query;

    // Find the coupon by its ID
    const coupon = await Coupon.findById(couponId);
    
    // Check if the coupon exists
    if (!coupon) {
      return res.json({ success: false, message: "Not a valid coupon" });
    }

    // Check if the total price meets the minimum price requirement
    if (coupon.minPrice > totalPrice) {
      return res.json({ success: false, message: "Not eligible for this coupon" });
    }

    const userId = res.locals.user?.id; // Get the user's ID

    // Check if the user has already used this coupon
    if (coupon.usedBy.includes(userId)) {
     console.log("showonfk")
      return res.json({ success: false, message: "You have already used this coupon." });
    }

    // Get the discount percentage and max redeem amount
    const discountPercentage = coupon.percentage;
    const maxRedeemAmount = coupon.maxRedeemAmount;

    // Return the valid coupon information
    return res.json({
      success: true,
      discountPercentage,
      maxRedeemAmount
    });

  } catch (error) {
    console.log("couponCheck error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



module.exports={
     loadCoupon,
     addCoupon,
     editCoupon,
     deleteCoupon,
     couponCheck
}
