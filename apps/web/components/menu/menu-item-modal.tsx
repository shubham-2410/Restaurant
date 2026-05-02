"use client";
import { useState, useEffect, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { MenuItem, MenuCategory, FoodType, GstRate } from "@restaurant/shared";

interface MenuItemModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: MenuItem | null;
  categories: MenuCategory[];
}

interface FormState {
  categoryId?: number;
  name: string;
  description: string;
  price: string;
  foodType: FoodType;
  gstRate: GstRate;
  isAvailable: boolean;
  imageUrl: string;
}

const INITIAL: FormState = {
  name: "",
  description: "",
  price: "",
  foodType: "veg",
  gstRate: "5",
  isAvailable: true,
  imageUrl: "",
};

export function MenuItemModal({ open, onClose, onSaved, item, categories }: MenuItemModalProps) {
  const { success, error } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        foodType: item.foodType,
        gstRate: item.gstRate,
        isAvailable: item.isAvailable,
        imageUrl: item.imageUrl ?? "",
      });
    } else {
      setForm({ ...INITIAL, categoryId: categories[0]?.id });
    }
  }, [item, categories, open]);

  const setField = <K extends keyof FormState>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        foodType: form.foodType,
        gstRate: form.gstRate,
        isAvailable: form.isAvailable,
        imageUrl: form.imageUrl || undefined,
      };
      if (isEditing && item) {
        await api.menu.items.update(item.id, payload);
        success("Item updated successfully");
      } else {
        await api.menu.items.create(payload);
        success("Item added to menu");
      }
      onSaved();
      onClose();
    } catch {
      error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Menu Item" : "Add Menu Item"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEditing ? "Save Changes" : "Add Item"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Category"
          required
          value={form.categoryId ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: parseInt(e.target.value) }))}
        >
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>

        <Input
          label="Item Name"
          required
          value={form.name}
          onChange={setField("name")}
          placeholder="e.g. Butter Chicken"
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={setField("description")}
          placeholder="Short description (optional)"
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Price (₹)"
            required
            value={form.price}
            onChange={setField("price")}
            placeholder="280.00"
          />
          <Select label="Food Type" required value={form.foodType} onChange={setField("foodType")}>
            <option value="veg">Veg</option>
            <option value="non_veg">Non-veg</option>
            <option value="egg">Egg</option>
          </Select>
          <Select label="GST Rate" required value={form.gstRate} onChange={setField("gstRate")}>
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </Select>
        </div>

        <Input
          label="Image URL"
          value={form.imageUrl}
          onChange={setField("imageUrl")}
          placeholder="https://..."
          type="url"
        />

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="available"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
            className="w-4 h-4 accent-orange-500"
          />
          <label htmlFor="available" className="text-sm font-medium text-slate-700">
            Item is available for ordering
          </label>
        </div>
      </div>
    </Modal>
  );
}
