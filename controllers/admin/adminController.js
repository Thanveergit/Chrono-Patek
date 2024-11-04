    const User = require("../../models/userModel");
    const Product=require("../../models/productModel");
    const Brand=require("../../models/brandModel");
    const Order=require("../../models/orderModel");
    const Category=require("../../models/categoryModel");
    const Wallet=require("../../models/walletModel");
    const bcrypt= require("bcrypt")


    //getting the admin login page
    const loadLogin=async(req,res)=>{
        try{

            if(req.session.admin){
                return  res.redirect("/admin/dashboard")
            }
            res.render("admin-login",{message:null})
        }catch(error){
            console.log(error)
        }
    }

    //verifying the login
    const verifyLogin=async(req,res)=>{
        try{
            const{email,password}=req.body
            const admin= await User.findOne({email,isAdmin:true})

            if(admin){
                const passwordMatch= await bcrypt.compare(password,admin.password)
                if(passwordMatch){
                        req.session.admin=true
                    return  res.redirect("/admin")
                }
                else{
                    return  res.render("admin-login",{message:"Invalid Password"})
                }
            }else{
                return   res.render("admin-login",{message:"admin not found"})
            }
        }catch(error){
            console.log("login error",error)
            return res.render("admin-login",{message:"internal server error"})
        }
    }

    //getting the dashboard page
    const loadDashboard = async (req, res) => {
        if (!req.session.admin) return res.redirect("/admin/login");
    
        try {
            const interval = req.query.interval || 'weekly';
            const today = new Date();
            let fromDate, toDate;
    
            if (interval === 'weekly') {
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 6);
                toDate = new Date(today);
            } else if (interval === 'monthly') {
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            } else if (interval === 'yearly') {
                fromDate = new Date(today.getFullYear(), 0, 1);
                toDate = new Date(today.getFullYear(), 11, 31);
            }
    
            const orderData = await Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    },
                },
                { $unwind: "$items" },
                {
                    $match: {
                        "items.itemStatus": "Delivered",
                        date: { $gte: fromDate, $lte: toDate }
                    },
                },
                { $sort: { date: -1 } }
            ]);
    
            const bestProducts = await Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productName",
                        totalQuantity: { $sum: { $toDouble: "$items.quantity" } },
                        images: { $first: "$items.image" } 
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        _id: 0,
                        productName: "$_id",
                        totalQuantity: 1,
                        image: "$images"  
                    },
                },
            ]);
            
            const bestCategories = await Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.categoryName",
                        totalQuantity: { $sum: { $toDouble: "$items.quantity" } } 
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        categoryName: "$_id",
                        totalQuantity: 1
                    },
                },
            ]);
            
            const topBrands = await Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.brandName",
                        totalQuantity: { $sum: { $toDouble: "$items.quantity" } } 
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        brandName: "$_id",
                        totalQuantity: 1
                    },
                },
            ]);
            
            // For the revenue calculation
            let revenue = 0, totalOrders = 0, discount = 0;
            for (let order of orderData) {
                totalOrders++;
                revenue += parseFloat(order.items.finalPrice) * parseFloat(order.items.quantity);
                discount += (parseFloat(order.items.price) - parseFloat(order.items.finalPrice)) * parseFloat(order.items.quantity);
            }
    
            const results = await Order.aggregate([
                { $unwind: "$items" },
                {
                    $match: {
                        "items.itemStatus": "Delivered",
                        date: { $gte: fromDate, $lte: toDate }
                    }
                },
                {
                    $project: {
                        intervalField: interval === 'weekly' ? { $dayOfWeek: "$date" } :
                                        interval === 'monthly' ? { $month: "$date" } :
                                        { $year: "$date" },
                        revenue: { $multiply: [{ $toDouble: "$items.quantity" }, { $toDouble: "$items.finalPrice" }] }
                    }
                },
                {
                    $group: {
                        _id: "$intervalField",
                        total: { $sum: "$revenue" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
    
            const getIntervalLabel = (id) => {
                if (interval === 'weekly') {
                    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    return daysOfWeek[id - 1];
                } else if (interval === 'monthly') {
                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    return months[id - 1];
                } else if (interval === 'yearly') {
                    return id.toString();
                }
            };
    
            const labels = results.map(result => getIntervalLabel(result._id));
            const values = results.map(result => result.total);
            
            // Prepare labels for the second chart if required
            const labels2 = bestProducts.map(product => product.productName);
            const values2 = bestProducts.map(product => product.totalQuantity);
    
            res.render('dashboard', {
                orders: orderData,
                revenue,
                totalOrders,
                discount,
                bestProducts,
                bestCategories,
                topBrands,
                labels,
                values,
                labels2, 
                values2, 
                interval
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("An error occurred while loading the dashboard.");
        }
    };
    

   
    //admin logout
    const logout= async(req,res)=>{
        try{
            req.session.destroy()
            return res.redirect("/admin/login")
        }catch(error){
            console.log(error)
            res.status(500).send("Internal server error")
        }
    }
        
    //getting the order page
    const loadOrders=async(req,res)=>{
        try {
            let search=''
            if(req.query.search){
                search=req.query.search;
            }
            const page=parseInt(req.query.page) || 1;
            const limit=6;
            const skip=(page-1)* limit;

            let orderData;
            if(search){
                orderData=await Order.aggregate([
                        {
                            $lookup:{
                                from:"users",
                                localField:"userId",
                                foreignField:"_id",
                                as:"user",

                            },
                        },
                        {$unwind:"$user"},
                        {
                            $match:{
                                $or:[
                                    {"user.name":{$regex:".*" + search + ".*", $options:"i"}},
                                    {status:{$regex:".*" + search + ".*",$options:"i"}},
                                    {paymentStatus:{$regex:".*" + search + ".*",$options:"i"}},
                                    {orderId:{$regex:".*" + search + ".*", $options:"i"}}
                                ],
                            },
                        },
                        {$sort:{date:-1}},
                        {$skip:skip},
                        {$limit:limit},
                ])
            }else{
                orderData= await Order.aggregate([
                        {
                            $lookup:{
                                from:"users",
                                localField:"userId",
                                foreignField:"_id",
                                as:"user",
                            },
                        },
                        {$unwind:"$user"},
                        {$sort:{date:-1}},
                        {$limit:limit},
                        {$skip:skip},
                ]);
            }

            const totalOrders= await Order.aggregate([
                {
                        $lookup:{
                            from:"user",
                            localField:"userId",
                            foreignField:"_id",
                            as:"user"
                        },
                },
                {$unwind:"$user"},
                {
                        $match:{
                            "user.name":{$regex:".*" + search + ".*", $options:"i"}
                        }
                },
                {$count:"totalOrders"},
            ]);
            
            const totalPages= totalOrders.length>0 ? Math.ceil(totalOrders[0].totalOrders/limit):0;

            res.render("orders",{orders:orderData,totalPages:totalPages,searchQuery:search,currentPage:page})
        } catch (error) {
            console.log(error);
        }
    }

    //order details for the admin
    const AdminOrderDetails= async(req,res)=>{
        try {
            const orderId= req.query.id;
            const order= await Order.findById(orderId).populate("userId").exec()
            if(!order){
                return res.render("orderDetails",{order:null,error:"Order not found"});
            }
            res.render("orderDetails",{order,error:null});
        } catch (error) {
            console.log("order details ",error);

        }
    }


//getting the sales report page
    const loadSalesReport = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);
            
            let orderData = await Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$items" },
                {
                    $match: {
                        "items.itemStatus": "Delivered"
                    }
                },
                {
                    $sort: { date: -1 }
                },
                {
                    $group: {
                        _id: null,
                        orders: { $push: "$$ROOT" },
                        totalSalesCount: { $sum: 1 },
                        totalAmount: { $sum: "$totalPrice" },
                        totalDiscount: { $sum: "$discount.discountAmount" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        orders: {
                            $slice: ["$orders", skip, limit]
                        },
                        totalSalesCount: 1,
                        totalAmount: 1,
                        totalDiscount: 1
                    }
                }
            ]);
    
            // If no data is returned, initialize empty values
            let reportData = orderData[0] || {
                orders: [],
                totalSalesCount: 0,
                totalAmount: 0,
                totalDiscount: 0
            };
    
            // Render the view with all required data
            res.render("salesReport", {
                orders: reportData.orders,
                totalSales: reportData.totalSalesCount,
                totalAmount: reportData.totalAmount,
                totalDiscount: reportData.totalDiscount,
                currentPage: page,
                totalPages: totalPages,
            });
        } catch (error) {
            console.log(error);
        }
    }
    
// filtering the sales report
    const filterInterval=async(req,res)=>{
        try {

            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);
            const interval=req.query.interval;
            let startDate;
            let today=new Date();

            switch(interval){
                case "daily":
                        startDate= new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
                        break;
                case "weekly":
                        startDate=new Date(today.getFullYear(),today.getMonth(),today.getDate()-7);
                        break;
                case "monthly":
                        startDate=new Date(today.getFullYear(),today.getMonth()-1,today.getDate());
                        break;
                case "yearly":
                        startDate=new Date(today.getFullYear()-1,today.getMonth(),today.getDate());
                        break;
                default:
                        startDate=new Date();
                        break;

            }

            let orderData= await Order.aggregate([
                {
                        $lookup:{
                            from:"user",
                            localField:"userId",
                            foreignField:"_id",
                            as:"user",
                        }
                },
                {$unwind:"$items"},
                {
                        $match:{
                            "items.itemStatus":"Delivered",
                            date:{$gte:startDate,$lte:today}
                        }
                },
                {
                        $group:{
                            _id:null,
                            orders:{$push:"$$ROOT"},
                            totalSalesCount:{$sum:1},
                            totalAmount:{$sum:"$totalPrice"},
                            totalDiscount:{$sum:"$discount.discountAmount"}
                        }
                }
            ]);

            let reportData= orderData[0] || {
                orders:[],
                totalAmount:0,
                totalSalesCount:0,
                totalDiscount:0,
            }

            res.render("salesReport",{
                orders:reportData.orders,
                totalSales:reportData.totalSalesCount,
                totalAmount:reportData.totalAmount,
                totalDiscount:reportData.totalDiscount,
                currentPage: page,
                totalPages: totalPages,
            })
        } catch (error) {
            console.log("filter report",error)
        }
    }

    //custom filtering for the sales report
    const filterReport = async (req, res, next) => {
        try {

            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);
            const startDate = new Date(req?.query?.startDate);
            const endDate = new Date(req?.query?.endDate);
    
            // Fetch and aggregate the data
            let orderData = await Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$items" }, 
                {
                    $match: {
                        "items.itemStatus": "Delivered",
                        date: { $gte: startDate, $lte: endDate }, 
                    },
                },
                {
                    $group: {
                        _id: null,
                        orders: { $push: "$$ROOT" }, 
                        totalSalesCount: { $sum: 1 }, 
                        totalAmount: { $sum: "$totalPrice" }, 
                        totalDiscount: { $sum: "$discount.discountAmount" }, 
                    },
                },
            ]);
    
            // Default values if no data is found
            let reportData = orderData[0] || {
                orders: [],
                totalSalesCount: 0,
                totalAmount: 0,
                totalDiscount: 0,
            };
    
            // Render the sales report view with the filtered data
            res.render("salesReport", {
                orders: reportData.orders,
                totalSales: reportData.totalSalesCount,
                totalAmount: reportData.totalAmount,
                totalDiscount: reportData.totalDiscount,
                startDate:startDate,
                endDate:endDate,
                currentPage: page,
                totalPages: totalPages,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("An error occurred while generating the sales report.");
        }
    };
    
    //update the status of the order
    const updateOrderStatus = async (req, res) => {
        try {
            const { orderId, itemId, currentStatus } = req.body;
    
            // Input validation
            if (!orderId || !itemId || !currentStatus) {
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
    
            // Find and update the specific item
            const targetItem = order.items.find(item => item._id.toString() === itemId);
            if (!targetItem) {
                return res.status(404).json({
                    success: false,
                    message: "Item not found in order"
                });
            }
    
            // Update item status
            targetItem.itemStatus = currentStatus;
    
            // Check if all items are in final states
            const allItemsCompleted = order.items.every(item => 
                item.itemStatus === "Delivered" || 
                item.itemStatus === "Cancelled" || 
                item.itemStatus === "Returned"
            );
    
            // Update order status based on items
            if (allItemsCompleted) {
                order.status = "Completed";
                order.paymentStatus = "Success";
            } else {
                order.status = "Pending";
            }
    
            await order.save();
    
            return res.json({
                success: true,
                status: order.status,
                paymentStatus: order.paymentStatus
            });
        } catch (error) {
            console.error("updateOrderStatus error:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred while updating order status"
            });
        }
    };

    // approval for the return product 
    const approvalForReturnProduct = async (req, res) => {
        try {
            const { orderId, itemId, status } = req.body;
    
            // Input validation
            if (!orderId || !itemId || !status) {
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
                item._id.toString() === itemId && 
                item.itemStatus === "Return Pending"
            );
            console.log(targetItem,"targetItem")
            if (!targetItem) {
                return res.status(404).json({
                    success: false,
                    message: "Item not found or not eligible for return"
                });
            }
            console.log(status,"status")
    
            const isReturnApproved = status.toLowerCase() === 'approve';

            console.log(isReturnApproved,"isReturnApproved")
    
            // Update item status
            targetItem.itemStatus = isReturnApproved ? "Returned" : status;
            targetItem.isApproved = isReturnApproved;
            const refundAmount = (targetItem.finalPrice || targetItem.price)*targetItem.quantity;
    
            // Check if all items are returned
            const allItemsReturned = order.items.every(item => item.itemStatus === "Returned");
            if (allItemsReturned) {
                order.status = "Returned";
            }
    
            await order.save();
    
            // Process refund if return is approved
            if (isReturnApproved && refundAmount > 0) {
                const userId = order.userId;
                console.log(userId,"fkjhkjhkjjhfdkjhhfskjhdkjhdkjhhkdkjd")
                let wallet = await Wallet.findOne({ userId });
    
                if (!wallet) {
                    wallet = new Wallet({
                        userId,
                        balance: refundAmount,
                        history: [{
                            amount: refundAmount,
                            transactionType: "Refund",
                            description: `Refund for order ${order.orderId}`,
                            newBalance: refundAmount
                        }]
                    });
                } else {
                    const newBalance = wallet.balance + refundAmount;
                    wallet.balance = newBalance;
                    wallet.history.push({
                        amount: refundAmount,
                        transactionType: "Refund",
                        description: `Refund for order ${order.orderId}`,
                        newBalance
                    });
                }
                console.log(wallet.balance)
    
                await wallet.save();
            }
            
            return res.json({
                success: true,
                status: targetItem.itemStatus,
                message: `Return ${isReturnApproved ? 'approved' : 'rejected'} successfully`
            });
        } catch (error) {
            console.error("approvalForReturnProduct error:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred while processing the return request"
            });
        }
    };
    

    module.exports={
        loadLogin,
        verifyLogin,
        loadDashboard,
        logout,
        loadOrders,
        AdminOrderDetails,
        updateOrderStatus,
        loadSalesReport,
        filterInterval,
        filterReport,
        approvalForReturnProduct
    }