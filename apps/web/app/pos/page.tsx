"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, MenuCategory, RestaurantTable } from "@restaurant/shared";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

interface CartItem { item: MenuItem; qty: number; }

export default function POSPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([api.menu.categories.list(), api.menu.items.list(), api.tables.list()]).then(([cats, items, tbls]) => {
      setCategories(cats);
      setMenuItems(items.filter((i) => i.isAvailable));
      setTables(tbls.filter((t) => t.status === "available"));
    });
  }, []);

  const filtered = activeCategory ? menuItems.filter((i) => i.categoryId === activeCategory) : menuItems;

  const addToCart = (item: MenuItem) => {
    setCart((c) => {
      const existing = c.find((ci) => ci.item.id === item.id);
      if (existing) return c.map((ci) => ci.item.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...c, { item, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((c) => c.map((ci) => ci.item.id === id ? { ...ci, qty: ci.qty + delta } : ci).filter((ci) => ci.qty > 0));
  };

  const subtotal = cart.reduce((s, ci) => s + parseFloat(ci.item.price) * ci.qty, 0);
  const gst = cart.reduce((s, ci) => s + (parseFloat(ci.item.price) * ci.qty * parseInt(ci.item.gstRate)) / 100, 0);
  const total = subtotal + gst;

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      await api.orders.create({
        tableId: selectedTable ?? undefined,
        orderType: selectedTable ? "dine_in" : "takeaway",
        items: cart.map((ci) => ({ menuItemId: ci.item.id, quantity: ci.qty })),
      });
      setCart([]);
      setSelectedTable(null);
      alert("Order placed! KOT sent to kitchen.");
    } catch {
      alert("Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2 p-4 overflow-x-auto border-b border-slate-200 bg-white">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${!activeCategory ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === c.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-slate-400 hover:shadow-sm transition-all"
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full mb-2 ${item.foodType === "veg" ? "bg-green-500" : "bg-red-500"}`} />
                <p className="font-medium text-slate-900 text-sm leading-tight mb-1">{item.name}</p>
                <p className="font-semibold text-slate-900">{formatCurrency(parseFloat(item.price))}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="font-semibold">Order ({cart.length} items)</h2>
            </div>
            <select
              value={selectedTable ?? ""}
              onChange={(e) => setSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Takeaway</option>
              {tables.map((t) => <option key={t.id} value={t.id}>{t.name} (capacity {t.capacity})</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((ci) => (
              <div key={ci.item.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ci.item.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(parseFloat(ci.item.price))}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(ci.item.id, -1)} className="p-1 rounded hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center text-sm font-medium">{ci.qty}</span>
                  <button onClick={() => updateQty(ci.item.id, 1)} className="p-1 rounded hover:bg-slate-100"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => setCart((c) => c.filter((x) => x.item.id !== ci.item.id))} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {!cart.length && <p className="text-sm text-slate-400 text-center py-8">Add items from the menu</p>}
          </div>
          <div className="p-4 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>GST</span><span>{formatCurrency(gst)}</span></div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <button
              onClick={placeOrder}
              disabled={!cart.length || placing}
              className="w-full bg-orange-500 text-white rounded-lg py-3 font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors mt-2"
            >
              {placing ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
