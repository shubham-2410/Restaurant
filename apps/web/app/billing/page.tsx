"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Bill } from "@restaurant/shared";
import { Receipt } from "lucide-react";

const statusColors = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800", partially_paid: "bg-blue-100 text-blue-800", refunded: "bg-slate-100 text-slate-600" };

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const load = () => api.billing.list().then(setBills).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Billing</h1>
        <p className="text-slate-500 mb-6">{bills.length} bills total</p>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Bill No.", "Order", "Subtotal", "GST", "Discount", "Total", "Method", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium flex items-center gap-2"><Receipt className="w-4 h-4 text-slate-400" />{bill.billNumber}</td>
                  <td className="px-4 py-3 text-slate-600">#{bill.orderId}</td>
                  <td className="px-4 py-3">{formatCurrency(parseFloat(bill.subtotal))}</td>
                  <td className="px-4 py-3">{formatCurrency(parseFloat(bill.gstAmount))}</td>
                  <td className="px-4 py-3">{formatCurrency(parseFloat(bill.discount))}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(parseFloat(bill.total))}</td>
                  <td className="px-4 py-3 capitalize">{bill.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[bill.paymentStatus]}`}>
                      {bill.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {!bills.length && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No bills yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
