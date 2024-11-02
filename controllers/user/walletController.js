const Wallet=require("../../models/walletModel");
const User=require("../../models/userModel");
const { parse } = require("dotenv");
const RazorPay=require("razorpay");
const crypto = require("crypto");


const razorpay=new RazorPay({
     key_id:process.env.RAZORPAY_KEY_ID,
     key_secret:process.env.RAZORPAY_SECRET_KEY,

})

const loadWallet= async(req,res)=>{
     try {

          const userData= await User.findOne({_id:req.session.user_id})
          // console.log(userData)
          let  wallet= await Wallet.findOne({userId:req.session.user_id});


          if(!wallet){
            wallet={balance:0,history:[]}
          }

          let bonusMessage= wallet.history.some(trasaction =>trasaction.transactionType==="bonus")
          ? "you have received a bonus for referring a freind!":"";

          let  bonusShown= req.session.bonusShown || false;
          
          if(bonusMessage && !bonusShown){
            req.session.bonusShown=true;
          }else{
            bonusMessage="";
          }

          const page=parseInt(req.query.page) || 1;
          const limit=4;
          const skip=(page - 1)*limit
          
          const sortedHistory=wallet.history.sort((a,b)=>new Date(b.date)-new Date(a.date));
          const paginatedHistory=sortedHistory.slice(skip,skip+limit);

          const totalItems=sortedHistory.length;
          const totalPages=Math.ceil(totalItems / limit);
          // console.log(wallet)
          res.render("wallet",
               {
               user:userData,
               wallet:wallet,
               history:paginatedHistory,
               currentPage:page,
               totalPages:totalPages,
               bonusMessage:bonusMessage,
               }
          )
     } catch (error) {
          console.log(error)
     }
}

// Create Razorpay order for adding funds to wallet
const addFunds = async (req, res) => {
     try {
         let amount=Number(req.body.amount)
         const userId = req.session.user_id;
         const user = await User.findById(userId);
         console.log(user)
 
         if (!user) {
             return res.status(404).json({ success: false, message: "User not found" });
         }

         let wallet = await Wallet.findOne({userId:userId});
         if(!wallet){
            wallet = new Wallet({
                userId:userId,
                balance:0,
                history:[]
            })
         }
         await wallet.save()
 
         const razorpayOrder = await razorpay.orders.create({
             amount: amount * 100, // Amount in paise
             currency: "INR",
             receipt: `receipt_order_${Date.now()}`,
         });
         console.log(razorpayOrder)
 
         res.json({
             success: true,
             razorpayOrderId: razorpayOrder.id,
             key: process.env.RAZORPAY_KEY_ID,
             amount: amount * 100,
             name: user.name,
             email: user.email,
             phone: user.phone,
         });

        

         
         await wallet.save()
     } catch (error) {
         console.log("addFunds Error:", error);
         res.status(500).json({ success: false, message: "Error creating Razorpay order" });
     }
 };
 

 
 const verifyPayment = async (req, res) => {
     try {
         const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
 
         console.log(razorpay_payment_id)
         const generated_signature = crypto
             .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
             .digest("hex");
 
         if (generated_signature !== razorpay_signature) {
             return res.status(400).json({ success: false, message: "Payment verification failed" });
         }
 
         const userId = req.session.user_id;
         let wallet = await Wallet.findOne({ userId });
         if(!wallet){
            wallet=new Wallet({
                userId:userId,
                balance:0,
                history:[]
            })
         }

         console.log(wallet,"thanveer")
 
         wallet.balance += amount / 100; // Convert to rupees
         wallet.history.push({
             transactionType: "Credit",
             amount: amount / 100,
             date: new Date(),
             transactionId: razorpay_payment_id,
             newBalance: wallet.balance
         });
 
         await wallet.save();
         res.json({ success: true, message: "Wallet updated successfully" });
 
     } catch (error) {
         console.log("verifyPayment Error:", error);
         res.status(500).json({ success: false, message: "Failed to verify payment" });
     }
 };
 

module.exports={
     loadWallet,
     addFunds,
     verifyPayment,
     
}