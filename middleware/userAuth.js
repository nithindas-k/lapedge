let authCheck = (req, res, next) => {
   console.log( req.session.user)
    if (['/account/:userId', '/wishlist', '/cart','/notifications'].includes(req.url)) {
        if (!req.session.user) {
            return res.redirect('/signup');
        }
        return next();
    } else if (['/signup', '/login',"/verifyotp"].includes(req.url)) {
        if (req.session.user) {
            return res.redirect('/');
        }
        return next();
    }
    return next();
};


module.exports = authCheck;