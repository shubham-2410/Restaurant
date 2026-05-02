"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION_DEFAULTS = exports.FOOD_TYPES = exports.PAYMENT_METHODS = exports.USER_ROLES = exports.TABLE_STATUSES = exports.KOT_STATUSES = exports.ORDER_STATUSES = exports.GST_RATES = exports.API_VERSION = void 0;
exports.API_VERSION = "v1";
exports.GST_RATES = [0, 5, 12, 18, 28];
exports.ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "served",
    "billed",
    "cancelled",
];
exports.KOT_STATUSES = ["pending", "preparing", "ready", "cancelled"];
exports.TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"];
exports.USER_ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"];
exports.PAYMENT_METHODS = ["cash", "card", "upi", "razorpay"];
exports.FOOD_TYPES = ["veg", "non_veg", "egg"];
exports.PAGINATION_DEFAULTS = {
    page: 1,
    limit: 20,
};
