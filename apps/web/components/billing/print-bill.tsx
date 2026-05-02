"use client";
import { formatCurrency } from "@/lib/utils";
import type { Bill, OrderItem, GstBreakdownEntry } from "@restaurant/shared";

interface PrintBillProps {
  bill: Bill;
  restaurantName: string;
  gstNumber?: string | null;
  address?: string | null;
  phone?: string | null;
}

export function PrintBill({ bill, restaurantName, gstNumber, address, phone }: PrintBillProps) {
  const order = bill.order;
  const items: OrderItem[] = order?.items ?? [];

  return (
    <div
      id="print-bill"
      className="hidden print:block font-mono text-xs text-black w-[72mm] mx-auto p-4"
      style={{ fontFamily: "monospace" }}
    >
      <div className="text-center mb-3">
        <p className="text-base font-bold uppercase">{restaurantName}</p>
        {address && <p className="text-[10px]">{address}</p>}
        {phone && <p className="text-[10px]">Tel: {phone}</p>}
        {gstNumber && <p className="text-[10px]">GSTIN: {gstNumber}</p>}
        <p className="text-[10px] mt-1">TAX INVOICE</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-[10px] space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>Bill No:</span><span className="font-bold">{bill.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span><span>{new Date(bill.createdAt).toLocaleDateString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {order?.table && (
          <div className="flex justify-between">
            <span>Table:</span><span>{order.table.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="capitalize">{order?.orderType?.replace("_", " ") ?? "—"}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: OrderItem) => (
            <tr key={item.id}>
              <td className="py-0.5 pr-1">{item.name}</td>
              <td className="text-center py-0.5">{item.quantity}</td>
              <td className="text-right py-0.5">{formatCurrency(parseFloat(item.price))}</td>
              <td className="text-right py-0.5 font-medium">
                {formatCurrency(parseFloat(item.price) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span><span>{formatCurrency(parseFloat(bill.subtotal))}</span>
        </div>

        {Object.entries(bill.gstBreakdown).map(([rate, data]) => {
          const entry = data as GstBreakdownEntry;
          return (
            <div key={rate} className="flex justify-between text-slate-600">
              <span>GST @{rate}% (₹{formatCurrency(entry.taxable)} taxable)</span>
              <span>{formatCurrency(entry.gst)}</span>
            </div>
          );
        })}

        {parseFloat(bill.discount) > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span><span>- {formatCurrency(parseFloat(bill.discount))}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-1" />
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span><span>{formatCurrency(parseFloat(bill.total))}</span>
        </div>
        {bill.paymentMethod && (
          <div className="flex justify-between">
            <span>Paid via</span>
            <span className="capitalize font-medium">{bill.paymentMethod.replace("_", " ")}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />
      <p className="text-center text-[10px]">Thank you for dining with us!</p>
      <p className="text-center text-[10px]">Please visit again</p>
    </div>
  );
}

export function triggerPrint() {
  window.print();
}
