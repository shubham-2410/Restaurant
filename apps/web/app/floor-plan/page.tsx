"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { RestaurantTable } from "@restaurant/shared";
import { Save, Move, X, ChevronDown } from "lucide-react";

type Shape = "rectangle" | "circle" | "square";

interface DraftTable extends RestaurantTable {
  dirty?: boolean;
}

const SHAPE_OPTS: { value: Shape; label: string }[] = [
  { value: "rectangle", label: "Rect" },
  { value: "square",    label: "Square" },
  { value: "circle",    label: "Round" },
];

const STATUS_COLOR: Record<string, string> = {
  available: "#22c55e",
  occupied:  "#ef4444",
  reserved:  "#f59e0b",
  cleaning:  "#6366f1",
};

/* Virtual canvas dimensions — positions are stored in this coordinate space */
const VIRT_W = 900;
const VIRT_H = 600;

/* Chip dimensions in virtual space */
function chipDims(shape: Shape) {
  if (shape === "circle")    return { w: 72, h: 72 };
  if (shape === "square")    return { w: 72, h: 72 };
  return { w: 96, h: 60 };
}

/* ── Draggable table shape ── */
function TableShape({
  table, selected, onSelect, onPositionChange, scale, hostRef,
}: {
  table: DraftTable;
  selected: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  scale: number;
  hostRef: React.RefObject<HTMLDivElement | null>;
}) {
  const x     = table.posX ?? 80;
  const y     = table.posY ?? 80;
  const color = STATUS_COLOR[table.status] ?? "#94a3b8";
  const shape = ((table.shape as string) === "rect" ? "rectangle" : (table.shape ?? "rectangle")) as Shape;
  const { w: W, h: H } = chipDims(shape);
  const dragRef = useRef<{ ox: number; oy: number; pointerId?: number } | null>(null);

  /* ── Pointer events (handles both mouse and touch uniformly) ── */
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();

    /* Convert screen coords → virtual canvas coords */
    const vx = (e.clientX - hostRect.left) / scale;
    const vy = (e.clientY - hostRect.top)  / scale;
    dragRef.current = { ox: vx - x, oy: vy - y, pointerId: e.pointerId };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const vx = (e.clientX - hostRect.left) / scale;
    const vy = (e.clientY - hostRect.top)  / scale;
    const nx = Math.max(0, Math.min(VIRT_W - W, vx - dragRef.current.ox));
    const ny = Math.max(0, Math.min(VIRT_H - H, vy - dragRef.current.oy));
    onPositionChange(Math.round(nx), Math.round(ny));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const radius = shape === "circle" ? "50%" : shape === "square" ? 8 : 10;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="floor-chip floor-chip--draggable"
      style={{
        left:         x,
        top:          y,
        width:        W,
        height:       H,
        background:   `${color}22`,
        border:       `2px solid ${selected ? "#2563eb" : color}`,
        borderRadius: radius,
        boxShadow:    selected ? "0 0 0 3px #2563eb44" : "0 1px 4px rgba(0,0,0,.1)",
        touchAction:  "none",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 800, color: "#1e293b", textAlign: "center", lineHeight: 1.2, padding: "0 4px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
        {table.name}
      </span>
      <span style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{table.capacity}p</span>
      <span style={{ fontSize: 8.5, color, fontWeight: 700, marginTop: 1, letterSpacing: "0.02em" }}>{table.status}</span>
    </div>
  );
}

/* ── Page ── */
export default function FloorPlanPage() {
  const { success, error } = useToast();
  const [tables,    setTables]    = useState<DraftTable[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  /* Canvas scaling */
  const outerRef  = useRef<HTMLDivElement | null>(null);
  const hostRef   = useRef<HTMLDivElement | null>(null);
  const [scale,   setScale]   = useState(1);
  const [hostH,   setHostH]   = useState(VIRT_H);

  /* Recalculate scale whenever the outer container resizes */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const recalc = () => {
      const avail = outer.clientWidth - 24; /* subtract padding */
      const s = Math.min(1, avail / VIRT_W);
      setScale(s);
      setHostH(Math.round(VIRT_H * s));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(outer);
    return () => ro.disconnect();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.tables.list();
      setTables(raw.map((t) => ({
        ...t,
        shape: (t.shape as string) === "rect" ? "rectangle" : t.shape,
      })));
    } catch (e) {
      error(e instanceof ApiError ? e.message : "Unable to load floor plan.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const updateTable = useCallback((id: number, patch: Partial<DraftTable>) =>
    setTables((ts) => ts.map((t) => t.id === id ? { ...t, ...patch, dirty: true } : t)),
  []);

  const saveAll = async () => {
    setSaving(true);
    try {
      const dirty = tables.filter((t) => t.dirty);
      await Promise.all(dirty.map((t) =>
        api.tables.update(t.id, {
          name:     t.name,
          capacity: t.capacity,
          status:   t.status,
          shape:    t.shape ?? undefined,
          posX:     t.posX ?? undefined,
          posY:     t.posY ?? undefined,
        }),
      ));
      success(`Saved ${dirty.length} table${dirty.length !== 1 ? "s" : ""}`);
      await load();
    } catch (e) {
      error(e instanceof ApiError ? e.message : "Failed to save layout.");
    } finally {
      setSaving(false);
    }
  };

  const selectTable = (id: number) => {
    setSelected(id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelected(null);
  };

  const sel        = selected !== null ? tables.find((t) => t.id === selected) : null;
  const dirtyCount = tables.filter((t) => t.dirty).length;

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--page-bg)" }}>

        {/* ── Top bar ── */}
        <div className="border-b px-4 py-2.5 flex items-center justify-between shrink-0 gap-3"
          style={{ background: "var(--surface)", borderColor: "var(--bdr)" }}>
          <div className="min-w-0">
            <h1 className="text-sm font-black leading-tight" style={{ color: "var(--text-primary)" }}>Floor Plan Editor</h1>
            <p className="text-xs hidden sm:block" style={{ color: "var(--text-faint)" }}>Drag tables to reposition</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dirtyCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold hidden sm:inline">
                {dirtyCount} unsaved
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={saveAll}
              loading={saving}
              disabled={dirtyCount === 0}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Layout</span>
              <span className="sm:hidden">Save{dirtyCount > 0 ? ` (${dirtyCount})` : ""}</span>
            </Button>
          </div>
        </div>

        {/* ── Main body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Canvas area ── */}
          <div
            ref={outerRef}
            className="floor-canvas-outer"
            style={{ flex: 1 }}
            onClick={(e) => { if (e.target === e.currentTarget) closePanel(); }}
          >
            {/* Wrapper that sets the display height to match scaled canvas */}
            <div style={{ position: "relative", width: "100%", height: hostH, minHeight: 120 }}>
              {/* The actual virtual canvas, scaled via CSS transform */}
              <div
                ref={hostRef}
                className="floor-canvas-host"
                style={{
                  position:        "absolute",
                  top:             0,
                  left:            0,
                  width:           VIRT_W,
                  height:          VIRT_H,
                  transformOrigin: "top left",
                  transform:       `scale(${scale})`,
                }}
                onClick={(e) => { if (e.target === e.currentTarget) closePanel(); }}
              >
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 14 }}>
                    Loading…
                  </div>
                ) : tables.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 6, color: "#94a3b8", fontSize: 13 }}>
                    <p>No tables found.</p>
                    <p style={{ fontSize: 12 }}>Add tables from the Tables page first.</p>
                  </div>
                ) : (
                  tables.map((t) => (
                    <TableShape
                      key={t.id}
                      table={t}
                      selected={selected === t.id}
                      onSelect={() => selectTable(t.id)}
                      onPositionChange={(x, y) => updateTable(t.id, { posX: x, posY: y })}
                      scale={scale}
                      hostRef={hostRef}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Legend below canvas */}
            <div className="floor-legend">
              {Object.entries(STATUS_COLOR).map(([s, c]) => (
                <span key={s} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#64748b" }}>
                  <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: c, display: "inline-block" }} />
                  <span className="capitalize">{s}</span>
                </span>
              ))}
              <span className="text-xs" style={{ color: "#94a3b8" }}>Tap to select · Drag to move</span>
            </div>
          </div>

          {/* ── Desktop side panel ── */}
          {sel && (
            <div className="hidden md:flex flex-col w-56 border-l overflow-y-auto shrink-0"
              style={{ borderColor: "var(--bdr)", background: "var(--surface)" }}>
              <EditorPanel
                sel={sel}
                onUpdate={(patch) => updateTable(sel.id, patch)}
                onClose={closePanel}
              />
            </div>
          )}
        </div>

        {/* ── Mobile bottom sheet panel ── */}
        {panelOpen && sel && (
          <>
            <div className="floor-panel-backdrop md:hidden" onClick={closePanel} />
            <div className="floor-side-panel md:hidden">
              <EditorPanel
                sel={sel}
                onUpdate={(patch) => updateTable(sel.id, patch)}
                onClose={closePanel}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

/* ── Shared editor panel ── */
function EditorPanel({
  sel, onUpdate, onClose,
}: {
  sel: DraftTable;
  onUpdate: (patch: Partial<DraftTable>) => void;
  onClose: () => void;
}) {
  const shape = ((sel.shape as string) === "rect" ? "rectangle" : (sel.shape ?? "rectangle")) as Shape;

  return (
    <>
      {/* Panel header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "var(--bdr)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          {sel.name}
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {/* Shape */}
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Shape</p>
          <div className="flex gap-1">
            {SHAPE_OPTS.map((o) => (
              <button
                key={o.value}
                onClick={() => onUpdate({ shape: o.value })}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                style={{
                  borderColor: shape === o.value ? "#2563eb" : "var(--bdr)",
                  background:  shape === o.value ? "#eff6ff" : "var(--surface)",
                  color:       shape === o.value ? "#1d4ed8" : "var(--text-muted)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Name</p>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            style={{ borderColor: "var(--bdr)" }}
            value={sel.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        {/* Capacity */}
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Capacity</p>
          <input
            type="number"
            min="1"
            max="50"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            style={{ borderColor: "var(--bdr)" }}
            value={sel.capacity}
            onChange={(e) => onUpdate({ capacity: parseInt(e.target.value) || 1 })}
          />
        </div>

        {/* Position */}
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Position</p>
          <div className="grid grid-cols-2 gap-2">
            {(["X", "Y"] as const).map((axis) => (
              <div key={axis}>
                <p className="text-[10px] mb-0.5" style={{ color: "var(--text-faint)" }}>{axis}</p>
                <input
                  type="number"
                  value={Math.round(axis === "X" ? (sel.posX ?? 0) : (sel.posY ?? 0))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  style={{ borderColor: "var(--bdr)" }}
                  onChange={(e) => onUpdate(axis === "X"
                    ? { posX: parseInt(e.target.value) || 0 }
                    : { posY: parseInt(e.target.value) || 0 }
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t flex items-center gap-1.5 text-xs" style={{ borderColor: "var(--bdr)", color: "var(--text-faint)" }}>
          <Move className="w-3 h-3 shrink-0" />
          Drag to reposition on canvas
        </div>

        {/* Legend */}
        <div className="pt-3 border-t" style={{ borderColor: "var(--bdr)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>
            Legend
          </p>
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2 mb-1.5">
              <div className="rounded-full shrink-0" style={{ width: 8, height: 8, background: c }} />
              <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
