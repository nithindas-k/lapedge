const ORDER_STATUS = Object.freeze({
    PENDING: "Pending",
    ORDERED: "Ordered",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
    RETURN_REJECTED: "Return Rejected",
    RETURN_REQUESTED: "Return Requested",
});

const PAYMENT_STATUS = Object.freeze({
    PENDING: "Pending",
    SUCCESS: "Success",
    FAILED: "Failed",
});

const PAYMENT_METHOD = Object.freeze({
    ONLINE_PAYMENT: "OnlinePayment",
    WALLET: "Wallet",
    COD: "COD",
});

module.exports = {
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
};
