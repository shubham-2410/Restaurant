"use client";
import {
  useEffect, useState, useCallback, useMemo,
  memo, Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, MenuCategory, RestaurantTable, User } from "@restaurant/shared";
import {
  Plus, Minus, Trash2, ShoppingCart, Search,
  Truck, UtensilsCrossed, Package, UserCircle,
  CheckCircle2, X, ChevronRight,
} from "lucide-react";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { FoodTypeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface CartItem { item: MenuItem; qty: number; }
type OrderType = "dine_in" | "takeaway" | "delivery";

const ORDER_TYPES: { value: OrderType; label: string; icon: React.ElementType }[] = [
  { value: "dine_in",  label: "Dine In",  icon: UtensilsCrossed },
  { value: "takeaway", label: "Takeaway", icon: Package },
  { value: "delivery", label: "Delivery", icon: Truck },
];

/* ═══════════════════════════════════════════════════════
   MENU ITEM CARD
   – Tap anywhere to add first unit
   – Once in cart: shows inline - qty + stepper at bottom
   ═══════════════════════════════════════════════════════ */
const MenuItemCard = memo(function MenuItemCard({
  item, inCart, onAdd, onInc, onDec,
}: {
  item:    MenuItem;
  inCart:  CartItem | undefined;
  onAdd:   (item: MenuItem) => void;
  onInc:   (id: number) => void;
  onDec:   (id: number) => void;
}) {
  const price = parseFloat(item.price);

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white rounded-lg overflow-hidden transition-shadow",
        inCart
          ? "shadow-sm ring-1 ring-blue-400"
          : "border border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {/* ── Card body (tappable to add first item) ── */}
      <button
        className="flex flex-col flex-1 p-3 text-left w-full"
        onClick={() => onAdd(item)}
        aria-label={inCart ? `${item.name} — ${inCart.qty} in cart` : `Add ${item.name}`}
        tabIndex={0}
      >
        {/* Veg / non-veg + GST */}
        <div className="flex items-center gap-1.5 mb-2">
          <FoodTypeDot type={item.foodType} />
          <span className="text-[10px] font-medium leading-none" style={{ color: "var(--text-faint)" }}>
            {item.gstRate}% GST
          </span>
        </div>

        {/* Name */}
        <p className="text-sm font-semibold leading-snug mb-0.5"
          style={{ color: "var(--text-primary)" }}>
          {item.name}
        </p>

        {/* Description */}
        {item.description && (
          <p className="text-[11px] line-clamp-1 mb-1.5" style={{ color: "var(--text-faint)" }}>
            {item.description}
          </p>
        )}

        {/* Price row */}
        <p className="text-sm font-bold mt-auto pt-1" style={{ color: "var(--brand)" }}>
          {formatCurrency(price)}
        </p>
      </button>

      {/* ── Stepper / Add button ── */}
      {inCart ? (
        /* Inline stepper — shown when item is in cart */
        <div
          className="flex items-center justify-between px-2 pb-2.5 pt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="card-stepper-btn card-stepper-btn--dec"
            onClick={(e) => { e.stopPropagation(); onDec(item.id); }}
            aria-label="Remove one"
            type="button"
          >
            {inCart.qty === 1
              ? <Trash2 className="w-3 h-3" />
              : <Minus  className="w-3 h-3" />
            }
          </button>

          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: "var(--brand)", minWidth: 20, textAlign: "center" }}
            aria-live="polite"
          >
            {inCart.qty}
          </span>

          <button
            className="card-stepper-btn card-stepper-btn--inc"
            onClick={(e) => { e.stopPropagation(); onInc(item.id); }}
            aria-label="Add one more"
            type="button"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* + button — shown when item is NOT in cart */
        <div className="px-2 pb-2.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            className="card-add-btn"
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            aria-label={`Add ${item.name}`}
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════
   CART ROW  (used in cart panel)
   ═══════════════════════════════════════════════════════ */
const CartRow = memo(function CartRow({
  ci, onInc, onDec,
}: { ci: CartItem; onInc: (id: number) => void; onDec: (id: number) => void }) {
  return (
    <div className="flex items-center gap-2 py-3 px-4 border-b last:border-0"
      style={{ borderColor: "var(--bdr-light)" }}>
      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight truncate"
          style={{ color: "var(--text-primary)" }}>
          {ci.item.name}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
          {formatCurrency(parseFloat(ci.item.price))}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="cart-stepper-btn cart-stepper-btn--dec"
          onClick={() => onDec(ci.item.id)}
          aria-label="Decrease"
          type="button"
        >
          {ci.qty === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
        <span
          className="text-[13px] font-bold tabular-nums text-center"
          style={{ color: "var(--text-primary)", minWidth: 22 }}
          aria-live="polite"
        >
          {ci.qty}
        </span>
        <button
          className="cart-stepper-btn cart-stepper-btn--inc"
          onClick={() => onInc(ci.item.id)}
          aria-label="Increase"
          type="button"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Line total */}
      <span
        className="text-[13px] font-bold tabular-nums shrink-0"
        style={{ color: "var(--text-primary)", minWidth: 56, textAlign: "right" }}
      >
        {formatCurrency(parseFloat(ci.item.price) * ci.qty)}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════
   CART PANEL
   Shared between desktop sidebar and mobile bottom-sheet
   ═══════════════════════════════════════════════════════ */
interface CartPanelProps {
  cart:            CartItem[];
  tables:          RestaurantTable[];
  staff:           User[];
  orderType:       OrderType;
  selectedTable:   number | null;
  selectedWaiter:  number | null;
  subtotal:        number;
  gst:             number;
  total:           number;
  placing:         boolean;
  inSheet?:        boolean;
  onOrderTypeChange: (v: OrderType) => void;
  onTableChange:     (v: number | null) => void;
  onWaiterChange:    (v: number | null) => void;
  onInc:             (id: number) => void;
  onDec:             (id: number) => void;
  onClear:           () => void;
  onPlaceClick:      () => void;
  onClose?:          () => void;
}

const CartPanel = memo(function CartPanel({
  cart, tables, staff, orderType, selectedTable, selectedWaiter,
  subtotal, gst, total, placing, inSheet,
  onOrderTypeChange, onTableChange, onWaiterChange,
  onInc, onDec, onClear, onPlaceClick, onClose,
}: CartPanelProps) {
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const canPlace  = cart.length > 0 && (orderType !== "dine_in" || selectedTable !== null);

  return (
    <div className="flex flex-col h-full">

      {/* ── Sheet handle (mobile only) ── */}
      {inSheet && (
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0" aria-hidden="true">
          <div className="w-8 h-1 rounded-full" style={{ background: "var(--bdr-strong)" }} />
        </div>
      )}

      {/* ── Top bar: title + close ── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 flex-shrink-0 border-b"
        style={{ borderColor: "var(--bdr)" }}>
        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--brand-light)" }}>
          <ShoppingCart className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>
            Order Cart
          </p>
          {cartCount > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {cartCount} item{cartCount !== 1 ? "s" : ""} · {formatCurrency(total)}
            </p>
          )}
        </div>
        {inSheet && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors ml-auto"
            style={{ color: "var(--text-muted)", background: "var(--surface-3)" }}
            aria-label="Close cart"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Order type selector ── */}
      <div className="px-4 pt-3 pb-0 flex-shrink-0">
        <div className="grid grid-cols-3 p-0.5 gap-0.5 rounded-md"
          style={{ background: "var(--surface-3)", border: "1px solid var(--bdr)" }}>
          {ORDER_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onOrderTypeChange(value)}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded transition-all"
              style={
                orderType === value
                  ? {
                      background: "var(--surface)",
                      color: "var(--brand)",
                      boxShadow: "var(--shadow-xs)",
                      borderRadius: "calc(var(--r-md) - 2px)",
                    }
                  : { color: "var(--text-faint)", borderRadius: "calc(var(--r-md) - 2px)" }
              }
              aria-pressed={orderType === value}
            >
              <Icon className="w-3 h-3" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Selectors: table + waiter ── */}
      <div className="px-4 pt-2.5 space-y-2 flex-shrink-0">
        {orderType === "dine_in" && (
          <select
            value={selectedTable ?? ""}
            onChange={(e) => onTableChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full text-sm focus:outline-none"
            style={{
              padding: "8px 10px",
              border: "1px solid var(--bdr)",
              borderRadius: "var(--r-md)",
              background: "var(--surface)",
              color: selectedTable ? "var(--text-primary)" : "var(--text-faint)",
            }}
          >
            <option value="">Select table…</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name} (seats {t.capacity})</option>
            ))}
          </select>
        )}
        {staff.length > 0 && (
          <select
            value={selectedWaiter ?? ""}
            onChange={(e) => onWaiterChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full text-sm focus:outline-none"
            style={{
              padding: "8px 10px",
              border: "1px solid var(--bdr)",
              borderRadius: "var(--r-md)",
              background: "var(--surface)",
              color: selectedWaiter ? "var(--text-primary)" : "var(--text-faint)",
            }}
          >
            <option value="">Assign waiter (optional)</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 mt-3 mb-0 h-px flex-shrink-0" style={{ background: "var(--bdr)" }} />

      {/* ── Items list (scrollable) ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {cart.length > 0 ? (
          <>
            {/* Column header */}
            <div className="flex items-center gap-2 px-4 py-2 sticky top-0"
              style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--bdr-light)" }}>
              <span className="flex-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                Item
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 w-20 text-center" style={{ color: "var(--text-faint)" }}>
                Qty
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 text-right" style={{ color: "var(--text-faint)", minWidth: 56 }}>
                Total
              </span>
            </div>
            {cart.map((ci) => (
              <CartRow key={ci.item.id} ci={ci} onInc={onInc} onDec={onDec} />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ background: "var(--surface-3)", border: "1px solid var(--bdr)" }}>
              <ShoppingCart className="w-5 h-5" style={{ color: "var(--text-faint)" }} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Cart is empty</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Tap items from the menu to add</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bill summary + CTA ── */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "var(--bdr)", background: "var(--surface)" }}>
        {cart.length > 0 && (
          <div className="px-4 pt-3 pb-2 space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>GST</span>
              <span className="tabular-nums font-medium">{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t"
              style={{ borderColor: "var(--bdr)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Total</span>
              <span className="text-base font-black tabular-nums" style={{ color: "var(--brand)" }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}

        <div className="px-4 pb-4 pt-2 space-y-2">
          <button
            onClick={onPlaceClick}
            disabled={!canPlace || placing}
            className="w-full py-3 text-sm font-bold text-white rounded transition-all"
            style={{
              background: canPlace && !placing ? "var(--brand)" : "var(--bdr-strong)",
              borderRadius: "var(--r-md)",
              cursor: canPlace && !placing ? "pointer" : "not-allowed",
              letterSpacing: "-0.01em",
            }}
          >
            {placing
              ? "Placing order…"
              : canPlace
              ? `Place Order · ${formatCurrency(total)}`
              : orderType === "dine_in"
              ? "Select a table first"
              : "Add items to continue"
            }
          </button>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="w-full text-xs font-semibold py-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Clear cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
function POSContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { success, error: toastError } = useToast();

  const preselectedTableId = useMemo(() => {
    const v = searchParams.get("tableId");
    return v ? parseInt(v) : null;
  }, [searchParams]);

  /* ── Data ── */
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([]);
  const [tables,     setTables]     = useState<RestaurantTable[]>([]);
  const [staff,      setStaff]      = useState<User[]>([]);

  /* ── UI state ── */
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search,          setSearch]          = useState("");
  const [cart,            setCart]            = useState<CartItem[]>([]);
  const [selectedTable,   setSelectedTable]   = useState<number | null>(preselectedTableId);
  const [selectedWaiter,  setSelectedWaiter]  = useState<number | null>(null);
  const [orderType,       setOrderType]       = useState<OrderType>("dine_in");
  const [placing,         setPlacing]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [cartSheetOpen,   setCartSheetOpen]   = useState(false);

  /* ── Load data ── */
  const load = useCallback(async () => {
    const [cats, items, tbls, staffList] = await Promise.all([
      api.menu.categories.list(),
      api.menu.items.list(),
      api.tables.list(),
      api.users.list(),
    ]);
    setCategories(cats);
    setMenuItems(items.filter((i) => i.isAvailable));
    setTables(tbls.filter((t) => t.status === "available" || t.id === preselectedTableId));
    setStaff(staffList.filter((u) => u.isActive && ["waiter", "cashier", "manager", "owner"].includes(u.role)));
  }, [preselectedTableId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (preselectedTableId) { setSelectedTable(preselectedTableId); setOrderType("dine_in"); }
  }, [preselectedTableId]);

  useEffect(() => { if (orderType !== "dine_in") setSelectedTable(null); }, [orderType]);

  /* ── Derived ── */
  const filtered = useMemo(() => menuItems.filter((i) => {
    const matchCat    = activeCategory === null || i.categoryId === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [menuItems, activeCategory, search]);

  const cartMap   = useMemo(() => new Map(cart.map((ci) => [ci.item.id, ci])), [cart]);
  const subtotal  = useMemo(() => cart.reduce((s, ci) => s + parseFloat(ci.item.price) * ci.qty, 0), [cart]);
  const gst       = useMemo(() => cart.reduce((s, ci) => s + (parseFloat(ci.item.price) * ci.qty * parseInt(ci.item.gstRate)) / 100, 0), [cart]);
  const total     = subtotal + gst;
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  /* ── Cart mutations ── */
  const addToCart = useCallback((item: MenuItem) => {
    setCart((c) => {
      const idx = c.findIndex((ci) => ci.item.id === item.id);
      if (idx !== -1) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...c, { item, qty: 1 }];
    });
  }, []);

  const incQty = useCallback((id: number) => {
    setCart((c) => c.map((ci) => ci.item.id === id ? { ...ci, qty: ci.qty + 1 } : ci));
  }, []);

  const decQty = useCallback((id: number) => {
    setCart((c) => c.reduce<CartItem[]>((acc, ci) => {
      if (ci.item.id !== id) { acc.push(ci); return acc; }
      if (ci.qty > 1) acc.push({ ...ci, qty: ci.qty - 1 });
      return acc;
    }, []));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const handlePlaceClick = useCallback(() => {
    if (!cart.length) return;
    if (orderType === "dine_in" && !selectedTable) {
      toastError("Select a table for dine-in"); return;
    }
    /* Close cart sheet before opening modal to avoid z-index fight */
    setCartSheetOpen(false);
    setShowConfirm(true);
  }, [cart.length, orderType, selectedTable, toastError]);

  const confirmPlaceOrder = useCallback(async () => {
    setPlacing(true);
    setShowConfirm(false);
    try {
      await api.orders.create({
        tableId:        selectedTable ?? undefined,
        orderType,
        assignedUserId: selectedWaiter ?? undefined,
        items: cart.map((ci) => ({ menuItemId: ci.item.id, quantity: ci.qty })),
      });
      setCart([]);
      setSelectedTable(null);
      setCartSheetOpen(false);
      await load();
      success("Order placed — KOT sent to kitchen.");
      if (preselectedTableId) router.push("/orders");
    } catch (e: unknown) {
      toastError((e as { message?: string })?.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }, [cart, orderType, selectedTable, selectedWaiter, load, preselectedTableId, router, success, toastError]);

  const cartPanelProps = {
    cart, tables, staff, orderType, selectedTable, selectedWaiter,
    subtotal, gst, total, placing,
    onOrderTypeChange: setOrderType,
    onTableChange:     setSelectedTable,
    onWaiterChange:    setSelectedWaiter,
    onInc: incQty, onDec: decQty, onClear: clearCart,
    onPlaceClick: handlePlaceClick,
  };

  const selectedTableName  = tables.find((t) => t.id === selectedTable)?.name;
  const selectedWaiterName = staff.find((u) => u.id === selectedWaiter)?.name;

  return (
    <AppLayout>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

        {/* ── LEFT: Menu panel ── */}
        <div
          className="pos-menu-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--page-bg)",
          }}
        >
          {/* Search + category bar */}
          <div style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--bdr)",
            padding: "10px 12px 8px",
            flexShrink: 0,
          }}>
            <div className="search-input-wrap" style={{ marginBottom: 8 }}>
              <Search aria-hidden="true" />
              <input
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items…"
                aria-label="Search menu items"
              />
            </div>
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>

          {/* Items grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", overscrollBehavior: "contain" }}>
            <div className="pos-items-grid">
              {filtered.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  inCart={cartMap.get(item.id)}
                  onAdd={addToCart}
                  onInc={incQty}
                  onDec={decQty}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full empty-state">
                  <div className="empty-state__icon-wrap">
                    <Search className="w-5 h-5" style={{ color: "var(--text-faint)" }} aria-hidden="true" />
                  </div>
                  <p className="empty-state__title">No items found</p>
                  <p className="empty-state__desc">Try a different search or category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart panel — desktop only ── */}
        <div
          className="pos-cart-panel"
          style={{
            width: 292,
            flexShrink: 0,
            borderLeft: "1px solid var(--bdr)",
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CartPanel {...cartPanelProps} />
        </div>
      </div>

      {/* ── Mobile: sticky cart CTA (above bottom nav) ── */}
      {cartCount > 0 && (
        <button
          className="pos-sticky-cta"
          onClick={() => setCartSheetOpen(true)}
          aria-label={`View cart — ${cartCount} items, ${formatCurrency(total)}`}
        >
          <span className="pos-sticky-cta__left">
            <span className="pos-sticky-cta__badge">{cartCount}</span>
            <span className="pos-sticky-cta__label">View Cart</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="pos-sticky-cta__total">{formatCurrency(total)}</span>
            <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
          </span>
        </button>
      )}

      {/* ── Mobile: cart bottom sheet ── */}
      {cartSheetOpen && (
        <>
          <div
            className="pos-cart-backdrop"
            onClick={() => setCartSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            className="pos-cart-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
          >
            <CartPanel
              {...cartPanelProps}
              inSheet
              onClose={() => setCartSheetOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Confirm modal (portal, z-9999) ── */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Order"
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={confirmPlaceOrder}
              loading={placing}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Confirm Order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Meta */}
          <div className="rounded-md p-3 text-sm space-y-2.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--bdr)" }}>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--text-muted)" }}>Order type</span>
              <span className="font-semibold capitalize px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--brand-light)", color: "var(--brand)", borderRadius: "var(--r-sm)" }}>
                {orderType.replace("_", " ")}
              </span>
            </div>
            {selectedTableName && (
              <div className="flex justify-between items-center">
                <span style={{ color: "var(--text-muted)" }}>Table</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{selectedTableName}</span>
              </div>
            )}
            {selectedWaiterName && (
              <div className="flex justify-between items-center">
                <span style={{ color: "var(--text-muted)" }}>Waiter</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{selectedWaiterName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-md overflow-hidden"
            style={{ border: "1px solid var(--bdr)" }}>
            <div className="px-3 py-2 border-b"
              style={{ background: "var(--surface-2)", borderColor: "var(--bdr)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </p>
            </div>
            {cart.map((ci) => (
              <div
                key={ci.item.id}
                className="flex items-center justify-between px-3 py-2.5 border-b last:border-0"
                style={{ borderColor: "var(--bdr-light)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--brand-light)", color: "var(--brand)", borderRadius: "var(--r-xs)" }}
                  >
                    {ci.qty}
                  </span>
                  <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    {ci.item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0 ml-2"
                  style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(parseFloat(ci.item.price) * ci.qty)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>GST</span><span className="tabular-nums">{formatCurrency(gst)}</span>
            </div>
            <div
              className="flex justify-between items-center pt-2 border-t"
              style={{ borderColor: "var(--bdr)" }}
            >
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>Total</span>
              <span className="text-lg font-black tabular-nums" style={{ color: "var(--brand)" }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={null}>
      <POSContent />
    </Suspense>
  );
}
