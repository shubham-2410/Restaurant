/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Calculate GST amount from base price and rate
 */
export function calculateGst(price: number, gstRate: number): number {
  return (price * gstRate) / 100;
}

/**
 * Calculate total including GST
 */
export function calculateTotal(price: number, gstRate: number): number {
  return price + calculateGst(price, gstRate);
}

/**
 * Generate a bill number
 */
export function generateBillNumber(tenantId: number, sequence: number): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `BILL-${yy}${mm}${dd}-${String(tenantId).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
