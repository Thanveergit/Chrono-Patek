const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        
    },
    offerPrice: {
        type: Number
    },
    image: [{
        type: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Brand",
        required:true
    }, 
    productDesc: {  
        type: String
    },
    status: {
        type: String,
        required: true,
        default: "active"
    },
    quantity: {
        type: Number,
        required: true
    },
    addedDate: {
        type: Date,
        default: Date.now  
    },
    highlights: [
        {
        type: String
    }
],
    productDetails: {
        type: String
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
