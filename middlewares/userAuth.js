const userModel = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        // Check if user is logged in via session or Passport
        const userId = req.session.user_id || (req.user && req.user.id);

        if (userId) {
            const userData = await userModel.findOne({ _id: userId });
            if (userData && userData.isBlocked === false) {
                // Proceed if the user is not blocked
                next();
            } else {
                // If the user is blocked
                delete req.session.user_id;
                req.session.message = 'You are blocked by admin';
                return res.redirect('/login');
            }
        } else {
            // No user is logged in, redirect to login
            return res.redirect("/login");
        }
    } catch (error) {
        res.send(error.message);
    }
};


const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id || req.user) {
            return res.redirect('/');
        } else {
            next();
        }
    } catch (error) {
        res.send(error.message);
    }
};



module.exports = {
    isLogout,
    isLogin,
};