const User=require("../../models/userModel");
const Cart=require("../../models/cartModel");
const Product=require("../../models/productModel");
const Address=require("../../models/addressModel");
const Coupon= require("../../models/couponModel");
const { model } = require("mongoose");

// calculating the total amount
function calculateCartTotal(cart){
     if(!cart || cart.items.length==0){
          return 0
     }
     let total=0
     cart.items.forEach(item=>{
          total+=item.productId.price *item.quantity;

     })
     return total;

}

// getting the cart page with the product
const loadCart = async (req, res) => {
    try {
        // Finding the user
        const userData = await User.findOne({ _id: req.session.user_id });

        // Finding the cart and populating product details including category
        const cartData = await Cart.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            });

        let cartCount = 0;
        if (cartData) {
            cartCount = cartData.items.length;

            // Check if the cart quantity exceeds the available quantity in stock
            cartData.items.forEach(async (item) => {
                const product = item.productId;

                // Update effective price based on available offer
                item.effectivePrice = product.offerPrice ? product.offerPrice : product.price;

                // Check and update quantity if it exceeds stock
                console.log("product quantity ",product.quantity)
                if (item.quantity > product.quantity) {
                    item.quantity = product.quantity;

                    await cartData.save();  
                }
            });
        }

        // Render the cart page
        res.render("cart", {
            user: userData,
            cart: cartData,
            cartCount: cartCount,
            calculateCartTotal: calculateCartTotal
        });
    } catch (error) {
        console.log("Error loading cart: ", error);
        res.status(500).json({ success: false, message: "An error occurred while loading the cart." });
    }
};

// adding product to the cart
const addToCart = async (req, res) => {
     try {
         const { id } = req.body;
 
         // Fetch product details, including the offer price
         const product = await Product.findById(id);
 
         // If the product has an offer, use the offer price; otherwise, use the regular price
         const productPrice = product.offerPrice ? product.offerPrice : product.price;
 
         const already = await Cart.findOne({ userId: req.session.user_id });
 
         if (!already) {
             // Create a new cart if no cart exists for the user
             const cartItem = new Cart({
                 userId: req.session.user_id,
                 items: [{ productId: id, price: productPrice }] 
             });
             console.log(cartItem)
             await cartItem.save();
             return res.status(200).json({ success: true, message: "Added to cart successfully" });
         } else {
             // Check if the product is already in the cart
             let flag = 0;
             already.items.forEach((item) => {
                 if (item.productId == id) {
                     flag = 1;
                 }
             });
 
             if (flag == 0) {
                 // Add the product to the cart if it's not already there
                 await Cart.updateOne(
                     { userId: req.session.user_id },
                     {
                         $push: {
                             items: { productId: id, price: productPrice }, 
                         }
                     }
                 );
                 return res.status(200).json({ success: true, message: "Added to cart successfully" });
             } else {
                 return res.status(400).json({ success: false, message: "Product already in cart" });
             }
         }
     } catch (error) {
         console.log("add to cart ", error);
         return res.status(500).json({ success: false, message: "An error occurred" });
     }
 };
 
 
// decrementing the qauntity 
const decrementCart= async(req,res)=>{
     try {
          console.log("adfad",req.body)
          const {index}=req.body;
          const item= await Cart.findOne({userId:req.session.user_id});
          if(item.items[index].quantity>1){
               item.items[index].quantity--
               await item.save();
               const total=item.items.reduce((acc,curr)=>acc+curr.productId.price * curr.quantity, 0);
               res.json({success:true,cartTotal:total});
          }else{
               res.json({success:false,message:"quantity cannot be less than 1"});
          }
          console.log(item)
     } catch (error) {
          console.log("decrement ",error);

     }
}

//incrementing the quantity
const incrementCart=async(req,res)=>{
     try {
          const {index}=req.body;
          console.log("jfhweih",req.body)
          const item= await Cart.findOne({userId:req.session.user_id});
          if(item.items[index].quantity<5){
               item.items[index].quantity++
               await item.save();
               const total=item.items.reduce((acc,curr)=>acc+curr.productId.price * curr.quantity, 0);
               res.json({success:true,cartTotal:total});
          }else{
               res.json({success:false,message:"you can`t buy more than 5 qauntitieees"});
          }
     } catch (error) {
          console.log("decrement",error);

     }
}

// removing the products from the cart
const removeFromCart = async (req, res) => {
     try {
         const { productId } = req.body;
         console.log(" productId:", productId);
         console.log("User ID:", req.session.user_id);
 
         const cart = await Cart.findOne({ userId: req.session.user_id });
         
         if (!cart) {
             console.log("Cart not found for user:", req.session.user_id);
             return res.status(404).json({ success: false, message: "Cart not found" });
         }
 
         console.log("Found cart:", cart);
 
         const index = cart.items.findIndex(item => item.productId.toString() === productId);
         console.log("Item index in cart:", index);
 
         if (index !== -1) {
             cart.items.splice(index, 1);
             await cart.save();
             console.log("Item removed, updated cart:", cart);
 
             // Calculate the new cart total
            const total=cart.items.reduce((acc,curr)=>acc+curr.productId.price * curr.quantity, 0);
 
             res.json({
                 success: true,
                 items: cart.items,
                 cartTotal: total,
                 itemCount: cart.items.length
             });
         } else {
             console.log("Item not found in cart");
             res.status(404).json({ success: false, message: "Item not found in cart" });
         }
     } catch (error) {
         console.error("Remove from cart error:", error);
         res.status(500).json({ success: false, message: "An error occurred while removing item from cart" });
     }
 };

 // getting the checkout page with the prouduts
const loadCheckout = async (req, res) => {
    try {
        // Finding the user
        const userData = await User.findOne({ _id: req.session.user_id });

        // Finding available coupons
        const couponData = await Coupon.find();

        // Finding user's address
        const addressData = await Address.findOne({ userId: req.session.user_id });

        // Finding cart and populating product and category details
        const cartData = await Cart.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            });
            
            if(!cartData ||cartData.items.length==0){
                
                return res.redirect("/cart")
            }
        // Check for quantity consistency and adjust if needed
        if (cartData) {
            cartData.items.forEach(async (item) => {
                const product = item.productId;

                // Check if the cart quantity exceeds the available stock
                if (item.quantity > product.quantity) {
                    item.quantity = product.quantity;
                    await cartData.save();  // Save the adjusted cart data
                }
            });
        }

        // Render the checkout page with updated data
        res.render("checkout", {
            user: userData,
            cart: cartData,
            addresses: addressData ? addressData.address : [],
            coupons: couponData,
        });
    } catch (error) {
        console.log("checkout ", error);
        res.status(500).json({ success: false, message: "An error occurred while loading checkout." });
    }
};


 // for adding the new address
 const addNewAddress= async(req,res)=>{
     try {
          //finding the user 
          const userData= await User.findOne({_id:req.session.user_id});
          //finding the address if the user had one
          let  address= await Address.findOne({userId:req.session.user_id});
          
          //if user doesnt have a address just adding the new one
          if(!address){
               address=new Address({
                    userId:userData._id,
                    address:[],
               });
          }
          //getting the element from the body
          const {name,district,house,pincode,state,phone,city}=req.body;
          //adding all the elements to the address
          address.address.push({
               name,
               district,
               pincode,
               state,
               phone,
               city,
          })
          // saving the address
          await address.save();
          return res.status(200).json({message:"address added successflly.."});

     } catch (error) {
          console.log('add address',error);
     }
 }
module.exports={
     loadCart,
     addToCart,
     calculateCartTotal,
     removeFromCart,
     decrementCart,
     incrementCart,
     loadCheckout,
     addNewAddress
}
