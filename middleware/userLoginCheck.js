const userLog = (req,res,next)=>{
    if(req.session.user){
        res.locals.userCredit = true;
        res.locals.userData = req.session.UserData  || req.session.userData
        return next()
    }   
    res.locals.userData = {}
    res.locals.userCredit = false;
    next();
}

module.exports = userLog;