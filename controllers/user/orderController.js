const User=require("../../models/userModel");
const Product=require("../../models/productModel");
const Cart=require("../../models/cartModel");
const Address= require("../../models/addressModel");
const Order=require("../../models/orderModel");
const Coupon=require("../../models/couponModel");
const mongoose=require("mongoose");
const RazorPay=require("razorpay");
const crypto=require("crypto");
const { deserializeUser } = require("passport");

//razorpay instance
const razorpay=new RazorPay({
     key_id:process.env.RAZORPAY_KEY_ID,
     key_secret:process.env.RAZORPAY_SECRET_KEY,

})

//creating order
const creatOrder = async (req, res) => {
     try {
         const userId = req.session.user_id;
         if (!userId) {
             return res.status(401).json({ success: false, message: "Unauthorized user" });
         }
         
         const cartData = await Cart.findOne({ userId }).populate({
             path: 'items.productId',
             populate: [{
                 path: "category",
                 model: "Category"
             },
            {
                path:"brand",
                model:"Brand"
             }]
         });
 
         const addressId = new mongoose.Types.ObjectId(req.body.selectedAddress);
         const addressArray = await Address.aggregate([
             { $unwind: "$address" },
             { $match: { "address._id": addressId } }
         ]);
 
         if (!addressArray || addressArray.length == 0 || !cartData) {
             return res.status(400).json({ success: false, message: "Invalid address or empty cart" });
         }
 
         const address = addressArray[0].address;
         const discountAmount = req.session.appliedDiscount?.discountAmount || 0;
         console.log(discountAmount)
         const couponId = req.session.appliedDiscount?.couponId || null;
         const totalPrice = req.body.totalPrice - discountAmount;
         console.log(totalPrice)
 
         const orderData = {
             orderId: Math.floor(100000 + Math.random() * 900000).toString(),
             userId,
             paymentMethod: req.body.paymentMethod,
             totalPrice: totalPrice,
             discount: {
                 couponId: couponId,
                 discountAmount: discountAmount
             },
             address: {
                 name: address.name,
                 phone: address.phone,
                 district: address.district,
                 city: address.city,
                 house: address.house,
                 state: address.state,
                 pincode: address.pincode,
             },
             items: [],
             status: "Ordered",
             date: Date.now()
         };
 
         for (const item of cartData.items) {
             let finalPrice = item.productId.price;
             if(item.productId.offerPrice){
               finalPrice=item.productId.offerPrice
             }
             orderData.items.push({
                 productId: item.productId._id,
                 productName: item.productId.productName,
                 categoryName: item.productId.category.name,
                 brandName:item.productId.brand.brandName,
                 image: item.productId.image[0],
                 quantity: item.quantity,
                 price: item.productId.price,
                 finalPrice: finalPrice,
             });
         }
 
         if (orderData.paymentMethod === "cod") {
             if (req.body.totalPrice > 60000) {
                 return res.json({ success: false, message: "Cannot place order with COD for amount above 60000" });
             }
             orderData.paymentStatus = "pending";
             
             // Create and save the order for COD
             const order = new Order(orderData);
             const savedOrder = await order.save();
             
             // Update product quantities and clear cart
             await updateProductQuantities(cartData.items);
             await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
             
             req.session.appliedDiscount = null;
             req.session.orderId = savedOrder._id;
 
             return res.json({ success: true, message: "Order Placed Successfully.." });
 
         } else if (orderData.paymentMethod === "razorpay") {
            const razorpayOrder = await razorpay.orders.create({
                amount: totalPrice * 100,
                currency: "INR",
                receipt: orderData.orderId
            });
        
            // Save the order with "pending" payment status before redirecting to Razorpay
            orderData.paymentStatus = "pending";  // Set initial payment status
            orderData.razorpayOrderId = razorpayOrder.id;
        
            const savedOrder = await new Order(orderData).save();
        
            // Store necessary info in session for later verification
            req.session.pendingOrder = {
                orderId: savedOrder._id,
                razorpayOrderId: razorpayOrder.id
            };
        
            return res.json({
                success: true,
                message: "Razorpay order created, redirecting to payment",
                razorpayOrderId: razorpayOrder.id,
                key: process.env.RAZORPAY_KEY_ID,
                amount: totalPrice * 100,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                orderId: savedOrder._id 
            });
        }
        
         else {
             return res.status(400).json({ success: false, message: "Invalid payment method" });
         }
 
     } catch (error) {
         console.log("order", error);
         return res.status(500).json({ success: false, message: "Internal server error" });
     }
 };
 
 //updating the quantities
 const updateProductQuantities = async (items) => {
     for (const item of items) {
         await Product.findByIdAndUpdate(
             item.productId._id,
             { $inc: { quantity: -item.quantity } }
         );
     }
 };
 
 // New function to handle Razorpay payment verification and order placement
 const verifyPaymentAndPlaceOrder = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const pendingOrder = req.session.pendingOrder;

        if (!pendingOrder) {
            return res.status(400).json({ success: false, message: "No pending order found" });
        }

        // Verify the Razorpay payment
        const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        // Fetch the order by ID to update payment status
        const order = await Order.findById(pendingOrder.orderId);

        if (isValid) {
            // Payment is valid, update payment status to "paid"
            order.paymentStatus = "paid";
            order.razorpayPaymentId = razorpay_payment_id;
            await order.save();

            // Update product quantities and clear cart
            const cartData = await Cart.findOne({ userId: order.userId });
            await updateProductQuantities(cartData.items);
            await Cart.findOneAndUpdate({ userId: order.userId }, { $set: { items: [] } });

            // Clear session data
            req.session.pendingOrder = null;
            req.session.appliedDiscount = null;
            req.session.orderId = order._id;

            return res.json({ success: true, message: "Payment verified and order placed successfully" });
        } else {
            // Payment failed; update payment status to "failed"
            order.paymentStatus = "failed";
            await order.save();

            return res.status(400).json({ success: false, message: "Invalid payment" });
        }
    } catch (error) {
        console.log("verify payment", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


//razorpay verification
const verifyRazorpayPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    // The verification process uses HMAC SHA256
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);

    // The data string that Razorpay used to generate the signature
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);

    // Creating the hmac in the required format
    const digest = shasum.digest('hex');

    // Comparing our digest with the actual signature
    if (digest === razorpaySignature) {
        return true;  
    } else {
        return false; 
    }
};

// order failure page
const orderFailed = async (req, res) => {
    try {
        const userId = req.session.user_id;

        if (!userId) {
            return res.redirect("/shope");
        }

        // Access orderId from session
        const orderId = req.session.pendingOrder?.orderId;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID not found in session" });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update order status
        order.paymentStatus = "failed";
        order.status = "failed";
        for (let item of order.items) {
            item.itemStatus = "Pending";
            console.log(item.itemStatus)
        }

        await order.save();
        
        // Clear session data related to pending orders
        req.session.pendingOrder = null;

        // Fetch user data
        const userData = await User.findById(userId);

        // Render the order failure page
        res.render("orderFailure", { user: userData });
    } catch (error) {
        console.error("order failed error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// retry for payment
const retryPayment = async (req, res) => {
    const { orderId } = req.body;
    console.log("from the body", req.body);

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Check if the order has already been paid
        if (order.paymentStatus === 'Success') {
            return res.status(400).json({ success: false, message: "This order has already been paid." });
        }

        // Create a new Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalPrice * 100, 
            currency: "INR",
            receipt: orderId.toString(),
            payment_capture: 1,
        });

        // Respond with the Razorpay order details and customer information
        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID, 
            amount: razorpayOrder.amount,
            razorpayOrderId: razorpayOrder.id,
            name: order.customerName, 
            email: order.customerEmail, 
            phone: order.customerPhone, 
        });

        
        // Update order status to 'Success'
        order.paymentStatus = 'Paid'; 
        console.log(order.paymentStatus)
        await order.save(); 

    } catch (error) {
        console.error('Retry Payment Error:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};



//for applying the discount to the orders 
const applyDiscount = async (req, res) => {
     try {
       // getting the elements from the req.body
       const { couponId, discountAmount } = req.body;
   
       // storing the discount to the session
       req.session.appliedDiscount = {
         couponId,
         discountAmount,
       };
       console.log(req.session.appliedDiscount);
   
       const userId = res.locals.user?.id;
       console.log(userId);
   
       // Find the coupon and check if the user has already used it
       const coupon = await Coupon.findOne({
          _id: couponId,
          usedBy: { $in: [userId] }, // Check if the userId exists in the usedBy array
        });
        
        console.log("fasfd0",coupon)
       // If coupon is found and the user has used it, return an error
       if (coupon) {
         return res.json({
           success: false,
           message: "You have already used this coupon.",
         });
       }
   
       // If the coupon is not used, proceed to mark it as used by the user
       await Coupon.updateOne(
         { _id: couponId }, // Find the coupon by its ID
         { $push: { usedBy: userId  } } // Add the user to the 'usedBy' array
       );
   
       res.json({ success: true, message: "Discount applied successfully" });
     } catch (error) {
       console.log("apply discount error:", error);
       res.status(500).json({ success: false, message: "Something went wrong" });
     }
   };
   




const removeCoupon=async(req,res)=>{
     try {
          const userId=res.locals.user?.id;
          const couponId=req.body.couponId;

          if(!req.session.appliedDiscount || req.session.appliedDiscount.couponId!== couponId){
               return res.json({success:false,message:"No coupon applied or coupon does not match."})
          }
          req.session.appliedDiscount=null;
           
          await Coupon.updateOne(
               {_id:couponId},
               {$pull:{usedBy:userId}}
          );

          return res.json({success:true,message:"Coupon removed successfully."});
     } catch (error) {
          console.log("removCoupon",error);
     }
}

//rendering to the order success page
const orderSuccess= async(req,res)=>{
     try {
          const userData= await User.findOne({_id:req.session.user_id});
          res.render("orderPlaced",{user:userData});
     } catch (error) {
          console.log("order success",error);
     }
}

//view order
const viewOrder=async(req,res)=>{
     try {
          const page=Number(req.query.page) || 1;
          const limit=6;
          const skip=(page-1)* limit;

          const userData= await User.findOne({_id:req.session.user_id});
          const totalOrders= await Order.countDocuments({userId:req.session.user_id});
          const orderData= await Order.find({userId:req.session.user_id}).sort({dat:-1}).skip(skip).limit(limit)

          const totalPages=Math.ceil(totalOrders / limit);
          res.render("viewOrders",{
               user:userData,
               order:orderData,
               currentPage:page,
               totalPages,
          });

     } catch (error) {
          console.log("veiw order",error);
     }
}

//order details
const orderDetails=async(req,res)=>{
     try {
          const userId=req.session.user_id;
          const orderId=req.query.orderId;

          if(!userId || !orderId){
               return redirect("/")
          }
          const userData=await User.findOne({_id:userId});
          const orderData=await Order.findOne({_id:orderId,userId:userId});

         res.render("order-details",
          {
               user:userData,
               order:orderData
          }
         )
     } catch (error) {
          console.log("order details",error);
     }
}

// cancel the order
const cancelOrder=async(req,res)=>{
     try {
          const {orderId,productId}=req.body;
          const orderData= await Order.findOne({_id:orderId});
          let allItemsCancelled=true;
          let refundAmount=0;

          if(!orderData){
               return res.json({sucess:false,message:"Order not found"})
          }
          for(let item of orderData.items){
               if(item.productId.toString()===productId){
                    item.itemStatus="Cancelled";

                    const product= await Product.findById(item.productId);
                    const itemPrice=product.price;

                    refundAmount=itemPrice*item.quantity;

                    await Product.findByIdAndUpdate(
                         item.productId,
                         {$inc:{quantity:item.quantity}}
                    );
               }
               if(item.itemStatus!=="Cancelled"){
                    allItemsCancelled=false;
               }
          }
          orderData.status=allItemsCancelled?"Completed":"Pending";
          await orderData.save();

          res.json({success:true,message:"Order item cancelled successfully"});
     } catch (error) {
          console.log("cancel order",error);
          
     }
}

// return the product
const returnProduct = async (req, res) => {
     try {
         const { productId, orderId, reason } = req.body;
 
         // Input validation
         if (!productId || !orderId || !reason) {
             return res.status(400).json({
                 success: false,
                 message: "Missing required fields"
             });
         }
 
         const order = await Order.findById(orderId);
         if (!order) {
             return res.status(404).json({
                 success: false,
                 message: "Order not found"
             });
         }
 
         const targetItem = order.items.find(item => 
             item.productId.toString() === productId && 
             item.itemStatus === "Delivered"
         );
 
         if (!targetItem) {
             return res.status(404).json({
                 success: false,
                 message: "Item not found or not eligible for return"
             });
         }
 
         // Update item status and reason
         targetItem.itemStatus = "Return Pending";
         targetItem.reason = reason;
         targetItem.returnRequestedAt = new Date();
 
         // Update order status
         order.status = "Return Requested";
         
         await order.save();
 
         return res.json({
             success: true,
             message: "Return request submitted successfully"
         });
     } catch (error) {
         console.error("returnProduct error:", error);
         return res.status(500).json({
             success: false,
             message: "An error occurred while processing your return request"
         });
     }
 };

 const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update order status and payment details
        order.status = 'failed';  // Change the status to 'Pending'
        for (let item of order.items) {
            item.itemStatus = "Ordered";  // Set item status to 'Ordered'
        }
        order.paymentStatus = 'Success';  // Update payment status to 'Success'
        order.razorpayPaymentId = paymentId;  // Store the Razorpay payment ID
        order.razorpaySignature = signature;  // Store the Razorpay signature

        // Save the updated order
        await order.save();

        // Respond with a success message
        res.json({
            success: true,
            message: 'Order status updated successfully.',
            order  // Optionally return the updated order object
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports={
     creatOrder,
     orderSuccess,
     viewOrder,
     orderDetails,
     cancelOrder,
     returnProduct,
     applyDiscount,
     retryPayment,
     verifyPaymentAndPlaceOrder,
     verifyRazorpayPayment,
     removeCoupon,
     orderFailed,
     updateOrderStatus
     // checkUsedCoupon,
}