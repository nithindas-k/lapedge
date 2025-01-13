const passport = require('passport')
const googleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema')
const env = require("dotenv").config()

// Add dynamic callback URL configuration
const callbackURL = process.env.NODE_ENV === 'production' 
  ? 'http://lapedge.shop/auth/google/callback'
  : 'http://localhost:3000/auth/google/callback';

passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL  // Use the dynamic callbackURL instead of process.env.GOOGLE_CALLBACK_URL
}, 

async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user && user.isBlocked) {
            return done(null, false, {message: "User Is Blocked"}); 
        }

        if (user) {
            return done(null, user);
        } else {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });
            await user.save();
            return done(null, user);
        }
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(err => {
            done(err, null)
        })
});

module.exports = passport;