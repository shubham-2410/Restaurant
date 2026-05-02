"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, MenuCategory } from "@restaurant/shared";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cats, menuItems] = await Promise.all([api.menu.categories.list(), api.menu.items.list()]);
    setCategories(cats);
    setItems(menuItems);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = activeCategory ? items.filter((i) => i.categoryId === activeCategory) : items;

  const toggleAvailability = async (item: MenuItem) => {
    await api.menu.items.update(item.id, { isAvailable: !item.isAvailable });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await api.menu.items.delete(id);
    load();
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
            <p className="text-slate-500">{items.length} items across {categories.length} categories</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeCategory ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === c.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.foodType === "veg" ? "bg-green-500" : item.foodType === "egg" ? "bg-yellow-500" : "bg-red-500"}`} />
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(parseFloat(item.price))}</span>
                </div>
                {item.description && <p className="text-sm text-slate-500 mb-3">{item.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">GST {item.gstRate}%</span>
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
