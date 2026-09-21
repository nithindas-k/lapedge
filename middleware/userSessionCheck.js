const { STATUS_CODES } = require("../enums");
const { MESSAGES } = require("../constants");

const userSessionCheck = (req, res, next) => {
    if (req.session.user && req.session.userData) {
        return next();
    }
    
    const acceptsJson = req.xhr || 
        (req.headers.accept && req.headers.accept.includes('json')) || 
        (req.headers['content-type'] && req.headers['content-type'].includes('json'));
        
    if (acceptsJson) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
            success: false,
            message: MESSAGES.SESSION_EXPIRED
        });
    }
    
    res.redirect('/login');
};

module.exports = userSessionCheck;
