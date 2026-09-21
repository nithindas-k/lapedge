const userSchema = require("../../models/userSchema");
const { STATUS_CODES } = require("../../enums");
const { MESSAGES } = require("../../constants");

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
        res.redirect("/admin/error");
    }
}


const userBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await userSchema.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.USER_BLOCKED_SUCCESS });
    } catch (error) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
    }
}

const userunBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await userSchema.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.USER_UNBLOCKED_SUCCESS });
    } catch (error) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
    }
}

const loadUserView  =  async (req, res) => {
    try {
        let id = req.query.id;
        const user = await userSchema.findById(id);
        res.render("userView", { user: user });
    } catch (error) {
        res.redirect("/admin/error");
    }

}

module.exports = {
    userInfo,
    userBlocked, 
    userunBlocked,
    loadUserView
}
