const userSessionCheck = (req, res, next) => {
    if (req.session.user && req.session.userData) {
        return next();
    }
    
    const acceptsJson = req.xhr || 
        (req.headers.accept && req.headers.accept.includes('json')) || 
        (req.headers['content-type'] && req.headers['content-type'].includes('json'));
        
    if (acceptsJson) {
        return res.status(401).json({
            success: false,
            message: 'Session expired or not logged in. Please login to continue.'
        });
    }
    
    res.redirect('/login');
};

module.exports = userSessionCheck;
