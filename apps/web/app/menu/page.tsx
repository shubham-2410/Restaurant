"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { MenuItem, MenuCategory } from "@restaurant/shared";
import { Plus, Search, UtensilsCrossed, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { MenuItemModal } from "@/components/menu/menu-item-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<"all" | "available" | "unavailable">("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, menuItems] = await Promise.all([api.menu.categories.list(), api.menu.items.list()]);
      setCategories(cats);
      setItems(menuItems);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    if (activeCategory !== null && i.categoryId !== activeCategory) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (availFilter === "available" && !i.isAvailable) return false;
    if (availFilter === "unavailable" && i.isAvailable) return false;
    return true;
  });

  const categoryCounts = items.reduce<Record<number, number>>((acc, i) => {
    acc[i.categoryId] = (acc[i.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.menu.items.setAvailability(item.id, !item.isAvailable);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !item.isAvailable } : i));
      success(`${item.name} marked as ${!item.isAvailable ? "available" : "unavailable"}`);
    } catch { error("Failed to update availability"); }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    try {
      await api.menu.items.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      success("Item deleted");
    } catch { error("Failed to delete item"); }
  };

  const unavailableCount = items.filter((i) => !i.isAvailable).length;

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <h1 className="text-xl font-bold text-slate-900">Menu</h1>
            </div>
            <p className="text-sm text-slate-500 pl-3.5">
              {items.length} items · {categories.length} categories
              {unavailableCount > 0 && (
                <span className="text-orange-500 font-medium"> · {unavailableCount} unavailable</span>
              )}
            </p>
          </div>
          <Button variant="primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {([["all", "All"], ["available", "Available"], ["unavailable", "Unavailable"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setAvailFilter(v)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                  availFilter === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={search ? "No items match your search" : "No menu items yet"}
            description={search ? "Try a different keyword." : "Add your first menu item to get started."}
            action={!search ? (
              <Button variant="primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto">
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={(i) => { setEditItem(i); setModalOpen(true); }}
                onDelete={deleteItem}
                onToggleAvailability={toggleAvailability}
              />
            ))}
          </div>
        )}
      </div>

      <MenuItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        item={editItem}
        categories={categories}
      />
    </AppLayout>
  );
}
