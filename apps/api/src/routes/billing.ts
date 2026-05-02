import type { FastifyInstance } from "fastify";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { bills, orders, menuItems, restaurantTables, kots } from "../db/schema/index.js";
import { RecordPaymentSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";
import { cashierUp, managerUp, floorStaff } from "../lib/rbac.js";

export default async function billingRoutes(fastify: FastifyInstance) {
  const cashierAuth = { preHandler: [authenticate, cashierUp] };
  const managerAuth  = { preHandler: [authenticate, managerUp] };
  // Bill generation is open to all floor staff (waiter/cashier/manager/owner)
  const floorAuth    = { preHandler: [authenticate, floorStaff] };

  // ── GET all bills ─────────────────────────────────────────────────────────
  fastify.get("/api/billing", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const allBills = await db.query.bills.findMany({
      where: eq(bills.tenantId, tenantId),
      with: { order: { with: { items: true, table: true } } },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
    return reply.send(allBills);
  });

  // ── IMPORTANT: static routes BEFORE parameterized ─────────────────────────
  // GET unbilled active orders
  fastify.get("/api/billing/pending-orders", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);

    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        ne(orders.status, "cancelled"),
        ne(orders.status, "billed"),
      ),
      with: { items: true, table: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });

    const billedRows = await db
      .select({ orderId: bills.orderId })
      .from(bills)
      .where(eq(bills.tenantId, tenantId));

    const billedSet = new Set(billedRows.map((b) => b.orderId));
    const unbilled  = activeOrders.filter((o) => !billedSet.has(o.id));

    return reply.send(unbilled);
  });

  // ── GET single bill (parameterized — must be after statics) ───────────────
  fastify.get("/api/billing/:id", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)),
      with: { order: { with: { items: true, table: true } } },
    });
    if (!bill) return reply.status(404).send({ message: "Bill not found" });
    return reply.send(bill);
  });

  // ── POST generate bill for an order ───────────────────────────────────────
  fastify.post("/api/billing/order/:orderId", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { orderId } = req.params as { orderId: string };
    const orderIdInt = parseInt(orderId);

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderIdInt), eq(orders.tenantId, tenantId)),
      with: { items: true },
    });

    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return reply.status(422).send({
        message: "This order was cancelled and cannot be billed. Please void and create a new order.",
      });
    }

    // If bill already exists — return it (idempotent, never error)
    const existingBill = await db.query.bills.findFirst({
      where: and(eq(bills.orderId, orderIdInt), eq(bills.tenantId, tenantId)),
    });
    if (existingBill) {
      const fullBill = await db.query.bills.findFirst({
        where: eq(bills.id, existingBill.id),
        with: { order: { with: { items: true, table: true } } },
      });
      return reply.status(200).send(fullBill);
    }

    // Build GST breakdown per rate
    const gstBreakdown: Record<string, { taxable: number; gst: number }> = {};
    for (const oi of order.items ?? []) {
      const [mi] = await db
        .select({ gstRate: menuItems.gstRate })
        .from(menuItems)
        .where(eq(menuItems.id, oi.menuItemId))
        .limit(1);
      const rate = mi?.gstRate ?? "5";
      const itemTaxable = parseFloat(oi.price) * oi.quantity;
      const itemGst     = (itemTaxable * parseInt(rate)) / 100;
      if (!gstBreakdown[rate]) gstBreakdown[rate] = { taxable: 0, gst: 0 };
      gstBreakdown[rate].taxable += itemTaxable;
      gstBreakdown[rate].gst     += itemGst;
    }

    const allBills   = await db.select().from(bills).where(eq(bills.tenantId, tenantId));
    const date       = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const billNumber = `BILL-${date}-${String(allBills.length + 1).padStart(4, "0")}`;

    const [bill] = await db
      .insert(bills)
      .values({
        tenantId,
        orderId: order.id,
        billNumber,
        subtotal:     order.subtotal,
        gstBreakdown,
        gstAmount:    order.gstAmount,
        total:        order.total,
      })
      .returning();

    // Advance order to "served" if it hasn't been served yet
    if (!["served", "billed"].includes(order.status)) {
      await db
        .update(orders)
        .set({ status: "served", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }

    const fullBill = await db.query.bills.findFirst({
      where: eq(bills.id, bill.id),
      with: { order: { with: { items: true, table: true } } },
    });
    return reply.status(201).send(fullBill);
  });

  // ── POST record payment ────────────────────────────────────────────────────
  fastify.post("/api/billing/:id/payment", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id }   = req.params as { id: string };
    const body     = RecordPaymentSchema.parse(req.body);

    const existing = await db.query.bills.findFirst({
      where: and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)),
    });
    if (!existing) return reply.status(404).send({ message: "Bill not found" });
    if (existing.paymentStatus === "paid") {
      return reply.status(409).send({ message: "This bill has already been paid." });
    }

    const discount = parseFloat(body.discount ?? "0");
    const newTotal = Math.max(0, parseFloat(existing.total) - discount).toFixed(2);

    const [bill] = await db
      .update(bills)
      .set({
        paymentMethod:      body.paymentMethod,
        paymentStatus:      "paid",
        discount:           body.discount ?? "0",
        total:              newTotal,
        razorpayOrderId:    body.razorpayOrderId,
        razorpayPaymentId:  body.razorpayPaymentId,
        paidAt:             new Date(),
      })
      .where(and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)))
      .returning();

    // Mark order as billed, free the table, and mark all KOTs as done
    const order = await db.query.orders.findFirst({ where: eq(orders.id, existing.orderId) });
    await db
      .update(orders)
      .set({ status: "billed", updatedAt: new Date() })
      .where(eq(orders.id, existing.orderId));

    // Mark all in-progress KOTs for this order as cancelled (completed/done)
    // so they disappear from the kitchen display board
    await db
      .update(kots)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(kots.orderId, existing.orderId), eq(kots.tenantId, tenantId)));

    if (order?.tableId) {
      await db
        .update(restaurantTables)
        .set({ status: "available", currentOrderId: null })
        .where(eq(restaurantTables.id, order.tableId));
    }

    const fullBill = await db.query.bills.findFirst({
      where: eq(bills.id, bill.id),
      with: { order: { with: { items: true, table: true } } },
    });
    return reply.send(fullBill);
  });

  // ── POST void / refund bill ────────────────────────────────────────────────
  fastify.post("/api/billing/:id/void", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id }   = req.params as { id: string };

    const [bill] = await db
      .update(bills)
      .set({ paymentStatus: "refunded" })
      .where(and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)))
      .returning();

    if (!bill) return reply.status(404).send({ message: "Bill not found" });

    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, bill.orderId));

    return reply.send(bill);
  });
}
