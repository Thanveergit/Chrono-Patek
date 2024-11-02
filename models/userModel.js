const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    phone: {
        type: Number,
        required: false,
        unique: false,
        default: null
    },
    password: {
        type: String,
        required: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true 
    },

    profilePicture: {
        type: String,
        required: false
    },
    referralCode:{
        type:String,
        unique:true
    },
    referredBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    referralCount:{
        type:Number,
        default:0,
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
