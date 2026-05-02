"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, MenuCategory, RestaurantTable, User } from "@restaurant/shared";
import { Plus, Minus, Trash2, ShoppingCart, Search, Truck, UtensilsCrossed, Package, UserCircle } from "lucide-react";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { FoodTypeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CartItem { item: MenuItem; qty: number; notes?: string; }
type OrderType = "dine_in" | "takeaway" | "delivery";

const ORDER_TYPES: { value: OrderType; label: string; icon: typeof Truck }[] = [
  { value: "dine_in",  label: "Dine In",  icon: UtensilsCrossed },
  { value: "takeaway", label: "Takeaway", icon: Package },
  { value: "delivery", label: "Delivery", icon: Truck },
];

export default function POSPage() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [placing, setPlacing] = useState(false);

  const load = useCallback(async () => {
    const [cats, items, tbls, staffList] = await Promise.all([
      api.menu.categories.list(),
      api.menu.items.list(),
      api.tables.list(),
      api.users.list(),
    ]);
    setCategories(cats);
    setMenuItems(items.filter((i) => i.isAvailable));
    setTables(tbls.filter((t) => t.status === "available"));
    setStaff(staffList.filter((u) => u.isActive && ["waiter", "cashier", "manager", "owner"].includes(u.role)));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (orderType !== "dine_in") setSelectedTable(null); }, [orderType]);

  const filtered = menuItems.filter((i) => {
    const matchCat = activeCategory === null || i.categoryId === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: MenuItem) =>
    setCart((c) => {
      const ex = c.find((ci) => ci.item.id === item.id);
      if (ex) return c.map((ci) => ci.item.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...c, { item, qty: 1 }];
    });

  const updateQty = (id: number, delta: number) =>
    setCart((c) => c.map((ci) => ci.item.id === id ? { ...ci, qty: ci.qty + delta } : ci).filter((ci) => ci.qty > 0));

  const subtotal = cart.reduce((s, ci) => s + parseFloat(ci.item.price) * ci.qty, 0);
  const gst = cart.reduce((s, ci) => s + (parseFloat(ci.item.price) * ci.qty * parseInt(ci.item.gstRate)) / 100, 0);
  const total = subtotal + gst;

  const placeOrder = async () => {
    if (!cart.length) return;
    if (orderType === "dine_in" && !selectedTable) { error("Select a table for dine-in"); return; }
    setPlacing(true);
    try {
      await api.orders.create({
        tableId: selectedTable ?? undefined,
        orderType,
        assignedUserId: selectedWaiter ?? undefined,
        items: cart.map((ci) => ({ menuItemId: ci.item.id, quantity: ci.qty, notes: ci.notes })),
      });
      setCart([]);
      setSelectedTable(null);
      load();
      success("Order placed! KOT sent to kitchen.");
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden">
        {/* ── LEFT: Menu panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-3 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items…"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
              />
            </div>
            <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {filtered.map((item) => {
              const inCart = cart.find((ci) => ci.item.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={cn(
                    "bg-white border-2 rounded-2xl p-3.5 text-left transition-all hover:shadow-md active:scale-[0.97] relative group",
                    inCart ? "border-orange-400 shadow-sm shadow-orange-100" : "border-transparent shadow-sm hover:border-orange-200",
                  )}
                >
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mb-2">
                    <FoodTypeDot type={item.foodType} />
                    <span className="text-[10px] font-medium text-slate-400">{item.gstRate}% GST</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-1">{item.description}</p>
                  )}
                  <p className="font-black text-orange-500 text-base">{formatCurrency(parseFloat(item.price))}</p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-2">
                <Search className="w-10 h-10 text-slate-200" />
                <p className="text-sm text-slate-400">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart panel ── */}
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col shadow-2xl">
          {/* Config */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="font-black text-slate-900 text-sm">New Order</h2>
              {cart.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </span>
              )}
            </div>

            {/* Order type */}
            <div className="grid grid-cols-3 gap-1.5">
              {ORDER_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setOrderType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold transition-all",
                    orderType === value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Table */}
            {orderType === "dine_in" && (
              <select
                value={selectedTable ?? ""}
                onChange={(e) => setSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium"
              >
                <option value="">Select a table…</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} (seats {t.capacity})</option>
                ))}
              </select>
            )}

            {/* Waiter */}
            {staff.length > 0 && (
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedWaiter ?? ""}
                  onChange={(e) => setSelectedWaiter(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex-1 border border-slate-200 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Assign waiter…</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length > 0 ? (
              <div className="py-1">
                {cart.map((ci) => (
                  <div key={ci.item.id} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight">{ci.item.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(parseFloat(ci.item.price))}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(ci.item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-black text-slate-900">{ci.qty}</span>
                      <button onClick={() => updateQty(ci.item.id, 1)} className="w-6 h-6 rounded-lg bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3 text-orange-600" />
                      </button>
                      <button
                        onClick={() => setCart((c) => c.filter((x) => x.item.id !== ci.item.id))}
                        className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors ml-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-400">Cart is empty</p>
                  <p className="text-xs text-slate-300 mt-0.5">Tap items to add</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary + Place */}
          <div className="p-4 border-t border-slate-100 bg-gradient-to-t from-white to-slate-50/50 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>GST</span><span className="tabular-nums">{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-lg pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="tabular-nums text-orange-500">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={placeOrder}
              disabled={!cart.length || (orderType === "dine_in" && !selectedTable)}
              loading={placing}
            >
              {placing ? "Placing…" : `Place Order · ${formatCurrency(total)}`}
            </Button>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors font-semibold">
                Clear cart
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
