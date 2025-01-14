const userSchema = require("../../models/userSchema")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Variant = require("../../models/variantModel")

const productSchema = require("../../models/productModel")
const Order = require("../../models/orderModel")
const Wallet = require("../../models/wallet")
const Transaction = require("../../models/waletTrancations");
const pdf = require("html-pdf")
const ejs = require("ejs");
const PDFDocument = require('pdfkit-table');
const xlsx = require('xlsx');


const loadLogin = (req, res) => {

    if (req.session.isAd) {
        return res.redirect("/admin/dashboard")
    }
    res.render('adminLogin', { message: null })
}
const error = async (req, res) => {
    res.render("error")

}


const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(password)
    try {

        const user = await userSchema.findOne({ email: email, isAdmin: true });

        if (!user) {

            return res.render("adminLogin", { message: "Invalid email or password.", messageType: "error" });
        }


        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log(passwordMatch)
        if (!passwordMatch) {
            return res.render("adminLogin", { message: "Invalid  password.", messageType: "error" });
        }
        req.session.isAdmin = true;


        return res.redirect("/admin/dashboard");

    } catch (error) {
        console.error("Login error: ", error);
        res.render("adminLogin", { message: "An error occurred. Please try again later." });
    }
};

const loadDashboard = async (req, res) => {

    try {

        const [topProducts, topCategories] = await Promise.all([


            Order.aggregate([
                { $match: { orderStatus: "Delivered" } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.ProductId",
                        total: { $sum: "$items.quantity" }
                    }
                },

                { $sort: { total: -1 } },
                { $limit: 10 },
                {
                    $addFields: {
                        _id: { $toObjectId: "$_id" }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        _id: 0,
                        productId: "$_id",
                        name: "$productDetails.name",
                        totalSold: "$total"
                    }
                }
            ]),


            Order.aggregate([
                { $match: { orderStatus: "Delivered" } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.ProductId",
                        total: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { total: -1 } },
                { $limit: 10 },
                {
                    $addFields: {
                        _id: { $toObjectId: "$_id" }
                    }
                },

                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },

                { $unwind: "$productDetails" },
                {
                    $group: {
                        _id: "$productDetails.category",
                        total: { $sum: "$total" }
                    }
                },
                {
                    $addFields: {
                        _id: { $toObjectId: "$_id" }
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                { $unwind: "$categoryDetails" }
            ]),



        ]);
        console.log("topProducts", topProducts)
        console.log("topCategories", topCategories)

        res.render('adminDashboard', { topProducts, topCategories, });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data');
    }
}


const loadAllProducts = async (req, res) => {
    try {

        const searchQuery = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const pageSize = 5;
        const skip = (currentPage - 1) * pageSize;


        const searchFilter = {
            name: { $regex: searchQuery, $options: 'i' },
        };


        const products = await productSchema.find(searchFilter).skip(skip).limit(pageSize).populate("category")


        const totalProducts = await productSchema.countDocuments(searchFilter);
        const totalPages = Math.ceil(totalProducts / pageSize);


        res.render('products', {
            products: products,
            currentPage: currentPage,
            totalPages: totalPages,
            searchQuery: searchQuery,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error loading products',
            error: error.message,
        });
    }
};
const ToggleProductBlock = async (req, res) => {
    try {
        const productId = req.params.id;


        const product = await productSchema.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }


        product.isBlocked = !product.isBlocked;
        await product.save();

        const statusMessage = product.isBlocked ? "Product unlisted successfully!" : "Product listed successfully!";

        return res.status(200).json({
            success: true,
            message: statusMessage
        });

    } catch (error) {
        console.error("Error in ToggleProductBlock:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error, please try again."
        });
    }
};

const LoadVariantManagement = async (req, res) => {
    try {

        const ramVariants = await Variant.find({ category: 'ram' });
        const processorVariants = await Variant.find({ category: 'processor' });
        const displayVariants = await Variant.find({ category: 'display' });
        const storageVariants = await Variant.find({ category: 'storage' });


        res.render('variantmanagement', {
            ramVariants,
            processorVariants,
            displayVariants,
            storageVariants
        });
    } catch (error) {
        console.error('Error loading variant management:', error);
        res.status(500).send('Error loading variant management page');
    }
}

const loadAllOrder = async (req, res) => {
    try {


        let page = 1;


        if (req.query.page && !isNaN(req.query.page)) {
            page = Math.max(1, parseInt(req.query.page));
        }



        const limit = 10;
        const skip = (page - 1) * limit;


        const totalOrders = await Order.countDocuments();
        const totalPages = Math.max(1, Math.ceil(totalOrders / limit));



        const orders = await Order.find()
            .populate("userId")
            .populate("items.ProductId")
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit)
            .sort({ orderDate: -1 });

        res.render("orderList", {
            orders,
            pagination: {
                currentPage: page,
                totalPages,
                hasPrevPage: page > 1,
                hasNextPage: page < totalPages,
                prevPage: page - 1,
                nextPage: page + 1
            }
        });

    } catch (error) {
        console.log('Error in loadAllOrder:', error);
        res.status(500).send("Internal Server Error");
    }
};

const loadOrderDetails = async (req, res) => {
    try {

        const { orderId } = req.params

        console.log('Loading order details', orderId)
        const order = await Order.findById(orderId).populate("userId").populate("items.ProductId")


        res.render("orderFullDetails", {
            order: order
        })

    } catch (error) {

    }


}


const updateOrderStatus = async (req, res) => {
    try {

        const { orderId } = req.params
        const { status } = req.body
        const order = await Order.findById(orderId)
        order.orderStatus = status
        order.paymentStatus = "Success"
        order.items.forEach(element => {
            element.status = status

        });
        await order.save()

        res.status(200).json({ success: true, message: "Order status updated successfully" })


    } catch (error) {
        console.log(error)
    }






}

const updatecancelOrder = async (req, res) => {
    try {

        const { orderId } = req.params
        console.log(orderId)
        const order = await Order.findById(orderId).populate("userId")
        const userId = order.userId
        for (let item of order.items) {
            const product = await productSchema.findById(item.ProductId)

            if (product) {
                product.quantity += item.quantity
                await product.save()
            }
        }



        order.orderStatus = "Cancelled"
        order.items.forEach(element => {
            element.status = "Cancelled"
        });

        const userWallet = await Wallet.findOneAndUpdate({ userId: userId }, {
            $inc: {
                balance: order.payableAmount
            }
        }, { upsert: true, new: true })
        await Transaction.create({
            userId: order.userId,
            walletId: userWallet._id,
            type: 'credit',
            amount: order.payableAmount,
            associatedOrder: order._id
        })
        console.log(userWallet)


        await order.save()

        res.status(200).json({ success: true, message: "Order cancelled successfully" })

    } catch (error) {
        console.log(error)

    }
}



const returnRequestCancel = async (req, res) => {
    try {
        const { itemId } = req.params
        const { orderId } = req.body

        const order = await Order.findById(orderId)
        const item = order.items.find(item => item._id.toString() === itemId)
        item.status = "Delivered"
        item.reason = null
        await order.save()

        res.status(200).json({ success: true, message: "Return request cancelled successfully" })




    } catch (error) {

        console.log(error)

    }
}

const approve = async (req, res) => {

    try {
        const { itemId } = req.params
        const { orderId } = req.body
        const order = await Order.findById(orderId).populate("userId", "_id")
        const userId = order.userId._id

        const item = order.items.find(item => item._id.toString() === itemId)
        item.status = "Returned"
        const allItemsReturned = order.items.every(item => item.status === "Returned");
        if (allItemsReturned) {
            order.orderStatus = "Returned";
        }


        await order.save()

        const wallet = await Wallet.findOne({ userId: userId })
        const walletId = wallet._id
        if (!wallet) {
            const newWallet = new Wallet({ userId: userId, balance: 0 })
            await newWallet.save()
        }
        let amount = item.totalPrice
        if (order.couponDiscount > 0) {
            console.log("trueeeeeeeeeeeeeeeeee")



            var proptionalDiscount = item.totalPrice / order.totalAmount * order.couponDiscount
            amount = item.totalPrice - proptionalDiscount.toFixed()



            console.log("+++++++++++++++++", amount)

        }
        wallet.balance += amount
        await wallet.save()

        const transaction = new Transaction({ walletId: walletId, userId: userId, amount: amount, type: "credit" })
        await transaction.save()





        res.status(200).json({ success: true, message: "Order Returned successfully" })



    } catch (error) {
        console.log(error)

    }
}


const AllReturn = async (req, res) => {
    try {

        const { orderId } = req.params
        const { returnReason } = req.body

        const order = await Order.findById(orderId).populate("items.ProductId")
        order.returnReason = returnReason
        order.items.forEach(element => {
            element.status = "Return Requested"
        });
        order.orderStatus = "Return Requested"
        await order.save()

        res.status(200).json({ success: true, message: "Return request sent successfully" })








    } catch (error) {
        console.log(error)

    }

}

const approveAll = async (req, res) => {
    try {
        const { orderId } = req.body

        const order = await Order.findById(orderId).populate("userId", "_id")
        const userId = order.userId._id.toString();

        const item = await order.items
        for (let data of item) {
            data.status = "Returned"

        }










        order.orderStatus = "Returned"
        const wallet = await Wallet.findOne({ userId: userId })

        wallet.balance += order.payableAmount
        await wallet.save()
        const transaction = new Transaction({ walletId: wallet._id, userId: userId, amount: order.payableAmount, type: "credit" })
        await transaction.save()
        await order.save()

        res.status(200).json({ success: true, message: "All items returned successfully" })




    } catch (error) {

        console.log(error)
    }

}

const salesRepoetLoad = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log("Start Date:", startDate, "End Date:", endDate);



        let orders = [];
        let totalSales = 0;
        let totalDiscount = 0;
        let totalOrders = 0
        let totalOrderWithDate = 0
        if (startDate > endDate) {

        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            totalOrderWithDate = await Order.find({ orderStatus: "Delivered", createdAt: { $gte: start, $lte: end } }).countDocuments()

            console.log("Parsed Dates - Start:", start, "End:", end);


            orders = await Order.find(
                { orderStatus: "Delivered", createdAt: { $gte: start, $lte: end } },
                'orderId createdAt payableAmount paymentStatus couponDiscount'
            ).populate('userId', 'name').populate('coupon');
            console.log("Fetched Orders:", orders);

            totalOrders = await Order.find({ orderStatus: "Delivered" }).countDocuments()

            const salesData = await Order.aggregate([
                { $match: { orderStatus: "Delivered", createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, totalSales: { $sum: "$payableAmount" } } }
            ]);
            console.log("Sales Data:", salesData);

            totalSales = salesData[0]?.totalSales || 0;




            const discountData = await Order.aggregate([
                { $match: { orderStatus: "Delivered", createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, totalDiscount: { $sum: "$couponDiscount" } } }
            ]);
            console.log("Discount Data:", discountData);

            totalDiscount = discountData[0]?.totalDiscount || 0;
        }

        console.log("+++++++++++++++++++++++++++++++++++++++++" + orders, totalSales, totalDiscount, startDate, endDate);

        res.render("salesReport", {
            orders: orders,
            totalSales: totalSales,
            totalDiscount: totalDiscount,
            startDate,
            endDate,
            totalOrders,
            totalOrderWithDate
        });
    } catch (error) {
        console.log(error)
        console.log("trueeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
        console.error("Error loading sales report:", error);
        res.status(500).send("An error occurred while generating the sales report.");
    }
};


const downloadPdf = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log("Start Date:", startDate, "End Date:", endDate);

        let matching = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matching = { orderStatus: "Delivered", createdAt: { $gte: start, $lte: end } };
        }

        const orders = await Order.find(matching)
            .populate('userId', 'name')
            .populate('coupon')
            .populate('items.ProductId', 'name salePrice')
            .sort({ createdAt: -1 });

        const salesData = await Order.aggregate([
            { $match: matching },
            { $group: { _id: null, totalSales: { $sum: "$payableAmount" } } }
        ]);

         const discountData = await Order.aggregate([
            { $match: matching },
            { $group: { _id: null, totalDiscount: { $sum: "$couponDiscount" } } }
        ]);

        const totalSales = salesData[0]?.totalSales || 0;
        const totalDiscount = discountData[0]?.totalDiscount || 0;


        const formatPrice = (num) => {
            return num.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            });
        };

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            layout: 'landscape'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="salesReport.pdf"');
        doc.pipe(res);


        doc.fontSize(16).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
        doc.fontSize(10).font('Helvetica')
            .text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' });
        doc.moveDown();

        const tableRows = [];

        
        const headers = [
            'Date',
            'Order ID',
            'Customer',
            'Product',
            'Quantity',
            'Unit Price',
            'Subtotal',
            'Discount',
            'Final Amount'
        ];


        orders.forEach(order => {
            order.items.forEach((item, index) => {
                const row = [
                    index === 0 ? new Date(order.createdAt).toLocaleDateString('en-IN') : '',
                    index === 0 ? order._id.toString().slice(-6) : '',
                    index === 0 ? (order.userId?.name || 'Unknown') : '',
                    item.ProductId?.name || 'Unknown',
                    item.quantity.toString(),
                    formatPrice(item.ProductId?.salePrice || 0),
                    formatPrice((item.ProductId?.salePrice || 0) * item.quantity),
                    index === 0 ? formatPrice(order.couponDiscount) : '',
                    index === 0 ? formatPrice(order.payableAmount) : ''
                ];
                tableRows.push(row);
            });
        });

      
        tableRows.push([
            'GRAND TOTAL',
            '',
            '',
            '',
            '',
            '',
            '',
            formatPrice(totalDiscount),
            formatPrice(totalSales)
        ]);


        const tableData = {
            headers: headers,
            rows: tableRows
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, indexCount) => {
                doc.font('Helvetica').fontSize(9);
                
                if (indexCount === tableRows.length - 1) {
                    doc.font('Helvetica-Bold');
                }
            },
            width: doc.page.width - 100,
            padding: 5,
            divider: {
                header: { disabled: false, width: 1, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.2 }
            },
            align: {
                4: 'center',    
                5: 'right',     
                6: 'right',     
                7: 'right',     
                8: 'right'      
            }
        });


        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(
                `Page ${i + 1} of ${totalPages}`,
                0,
                doc.page.height - 30,
                { align: 'center' }
            );
        }

        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("An error occurred while generating the PDF.");
    }
};


const sales = async (req, res) => {
    try {
        const { startDate, endDate, interval } = req.query;


        const query = {
            createdAt: {
                $gte: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
                $lte: endDate ? new Date(endDate) : new Date()
            },
            orderStatus: "Delivered"
        };

        let groupBy = {};
        let dateFormat = {};

        switch (interval) {
            case 'weekly':
                groupBy = {
                    _id: { $week: "$createdAt" },
                    totalSales: { $sum: "$payableAmount" },
                    count: { $sum: 1 }
                };
                dateFormat = { _id: 1 };
                break;

            case 'monthly':
                groupBy = {
                    _id: { $month: "$createdAt" },
                    totalSales: { $sum: "$payableAmount" },
                    count: { $sum: 1 }
                };
                dateFormat = { _id: 1 };
                break;

            case 'yearly':
                groupBy = {
                    _id: { $year: "$createdAt" },
                    totalSales: { $sum: "$payableAmount" },
                    count: { $sum: 1 }
                };
                dateFormat = { _id: 1 };
                break;

            default:
                groupBy = {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalSales: { $sum: "$payableAmount" },
                    count: { $sum: 1 }
                };
                dateFormat = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
                break;
        }

        const salesData = await Order.aggregate([
            { $match: query },
            { $group: groupBy },
            { $sort: dateFormat }
        ]);

        const formattedData = salesData.map(item => {
            let formattedId;
            switch (interval) {
                case 'weekly':
                    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    formattedId = daysOfWeek[item._id - 1];
                    break;
                case 'monthly':
                    formattedId = `Day ${item._id}`;
                    break;
                case 'yearly':
                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    formattedId = months[item._id - 1];
                    break;
                default:
                    formattedId = `${item._id.day}-${item._id.month}-${item._id.year}`;
                    break;
            }
            return {
                ...item,
                _id: formattedId
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching sales data",
            error: error.message
        });
    }
};


const downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log("Start Date:", startDate, "End Date:", endDate);

        let matching = { orderStatus: "Delivered", paymentStatus: "Success" };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matching.createdAt = { $gte: start, $lte: end };
        }

        const orders = await Order.find(matching)
            .populate('userId', 'name')
            .populate('items.ProductId', 'name salePrice')
            .sort({ createdAt: -1 });


        let totalAmount = 0;
        let totalDiscount = 0;


        const excelRows = [];

        excelRows.push([
            'Date',
            'Order ID',
            'Customer',
            'Product',
            'Quantity',
            'Unit Price',
            'Subtotal',
            'Discount',
            'Final Amount'
        ]);


        orders.forEach(order => {
            order.items.forEach((item, index) => {
                const unitPrice = item.ProductId?.salePrice || 0;
                const subtotal = unitPrice * item.quantity;
                const discount = order.couponDiscount || 0;
                const finalAmount = order.payableAmount;

                totalAmount += finalAmount;
                totalDiscount += discount;

                excelRows.push([
                    new Date(order.createdAt).toLocaleDateString('en-IN'),
                    order._id.toString().slice(-6),
                    order.userId?.name || 'Unknown',
                    item.ProductId?.name || 'Unknown',
                    item.quantity,
                    unitPrice.toFixed(2),
                    subtotal.toFixed(2),
                    discount.toFixed(2),
                    finalAmount.toFixed(2)
                ]);
            });
        });


        excelRows.push([
            'GRAND TOTAL',
            '',
            '',
            '',
            '',
            '',
            '',
            totalDiscount.toFixed(2),
            totalAmount.toFixed(2)
        ]);


        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.aoa_to_sheet(excelRows);

        const colWidths = [
            { wch: 12 },
            { wch: 10 },
            { wch: 20 },
            { wch: 30 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 }
        ];
        worksheet['!cols'] = colWidths;


        const range = xlsx.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = xlsx.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "D3D3D3" } }
            };
        }


        const lastRow = excelRows.length - 1;
        for (let C = 0; C <= range.e.c; ++C) {
            const address = xlsx.utils.encode_cell({ r: lastRow, c: C });
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                font: { bold: true }
            };
        }

        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');


        const buffer = xlsx.write(workbook, { type: 'buffer' });


        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=SalesReport-${new Date().toLocaleDateString('en-IN')}.xlsx`
        );


        res.send(buffer);

    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(500).send("An error occurred while generating the Excel file.");
    }
};



module.exports = {
    loadLogin,
    login,
    loadDashboard,
    error,
    loadAllProducts,
    ToggleProductBlock,
    LoadVariantManagement,
    loadAllOrder,
    loadOrderDetails,
    updateOrderStatus,
    updatecancelOrder,
    returnRequestCancel,
    approve,
    AllReturn,
    approveAll,
    salesRepoetLoad,
    downloadPdf,
    sales,
    downloadExcel
}