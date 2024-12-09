const userLog = (req,res,next)=>{
    if(req.session.user){
        res.locals.userCredit = true;
        return next()
    }   
    res.locals.userCredit = false;
    next();
}

module.exports = userLog;