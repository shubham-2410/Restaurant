"use client";
import { useEffect } from "react";
import type { Kot } from "@restaurant/shared";

interface KotPrintProps {
  kot: Kot;
  restaurantName?: string;
}

export function KotPrint({ kot, restaurantName = "RestaurantOS" }: KotPrintProps) {
  useEffect(() => {
    const style = document.createElement("style");
    style.id    = "kot-print-style";
    style.textContent = `
      @media print {
        body > *:not(#kot-print-root) { display: none !important; }
        #kot-print-root { display: block !important; font-family: monospace; }
      }
      #kot-print-root { display: none; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("kot-print-style")?.remove(); };
  }, []);

  return (
    <div id="kot-print-root" style={{ width: "80mm", padding: "8px", fontFamily: "monospace", fontSize: "12px" }}>
      <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>{restaurantName}</p>
      <p style={{ textAlign: "center" }}>** KITCHEN ORDER TICKET **</p>
      <hr />
      <p>KOT #: {kot.id}</p>
      <p>Table: {kot.order?.table?.name ?? "Takeaway"}</p>
      <p>Time:  {new Date(kot.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
      {kot.isPriority && <p style={{ fontWeight: "bold" }}>*** RUSH ORDER ***</p>}
      <hr />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Item</th>
            <th style={{ textAlign: "right" }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {kot.items?.map((item) => (
            <tr key={item.id}>
              <td>
                <div>{item.name}</div>
                {item.notes && <div style={{ fontSize: "10px", fontStyle: "italic" }}>Note: {item.notes}</div>}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>×{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <p style={{ textAlign: "center", fontSize: "10px" }}>
        Printed at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

export function triggerKotPrint() {
  window.print();
}
