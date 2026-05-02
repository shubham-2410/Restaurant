"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.calculateGst = calculateGst;
exports.calculateTotal = calculateTotal;
exports.generateBillNumber = generateBillNumber;
exports.slugify = slugify;
exports.deepClone = deepClone;
/**
 * Format a number as Indian Rupees
 */
function formatCurrency(amount) {
    var num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(num);
}
/**
 * Calculate GST amount from base price and rate
 */
function calculateGst(price, gstRate) {
    return (price * gstRate) / 100;
}
/**
 * Calculate total including GST
 */
function calculateTotal(price, gstRate) {
    return price + calculateGst(price, gstRate);
}
/**
 * Generate a bill number
 */
function generateBillNumber(tenantId, sequence) {
    var date = new Date();
    var yy = String(date.getFullYear()).slice(-2);
    var mm = String(date.getMonth() + 1).padStart(2, "0");
    var dd = String(date.getDate()).padStart(2, "0");
    return "BILL-".concat(yy).concat(mm).concat(dd, "-").concat(String(tenantId).padStart(2, "0"), "-").concat(String(sequence).padStart(4, "0"));
}
/**
 * Slugify a string
 */
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
