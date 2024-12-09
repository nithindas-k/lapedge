const userSchema = require("../../models/userSchema");

const userInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search.trim();
        }
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page);
        }
        let limit = 5; 
        const itemsPerPage = limit; 

        const userData = await userSchema.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        userData.forEach(user => {
            user.createdAt = user.createdAt.toLocaleDateString();
        });

        const count = await userSchema.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { email: { $regex: ".*" + search + ".*" } }
            ],
        }).countDocuments();

        const totalpage = Math.ceil(count / limit);

        res.render("users", {
            data: userData,
            totalpage: totalpage,
            currentPage: page,
            search: search,
            itemsPerPage: itemsPerPage 
        });

    } catch (error) {
        res.redirect("/pageerror");
    }
}


const userBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await userSchema.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.json({ success: true , message:"User blocked successfully"});
    } catch (error) {
        res.json({ success: false ,message:"somthing went wrong"});
    }
}

const userunBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await userSchema.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.json({ success: true ,message:"user unBaned successfully"});
    } catch (error) {
        res.json({ success: false, message:"somthing went wrong"});
    }
}

const loadUserView  =  async (req, res) => {
    try {
        let id = req.query.id;
        const user = await userSchema.findById(id);
        res.render("userView", { user: user });
    } catch (error) {
        res.redirect("/pageerror");
    }

}

module.exports = {
    userInfo,
    userBlocked, 
    userunBlocked,
    loadUserView
}
