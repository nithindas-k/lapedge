const authCheck = (req, res, next) => {
 if(req.session.userData){
    res.redirect("/")

 }else{
    next()
 }

};

module.exports = authCheck;