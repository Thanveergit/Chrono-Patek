const mongoose = require("mongoose");
const path = require("path");
const express = require("express");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const app = express();
const User=require("./models/userModel")

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
      secure:false,
      httpOnly:true,
      maxAge:72*60*60*1000
    }
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Set up the view engine
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"),path.join(__dirname, "views/admin")]);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));


// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user for session handling
passport.serializeUser((user, done) => {
  done(null, user._id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); 
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// Configure Google Strategy for Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "https://chronopatek.shop/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database by Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          // If the user doesn't exist, create a new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            isGoogleAuth: true
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


// Use the user route
app.use("/", userRoute);

// Use the admin route
app.use("/admin", adminRoute);

// Start the server
const PORT=process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
