import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, orderItems, restaurantTables, menuItems, kots, kotItems } from "../db/schema/index.js";
import { CreateOrderSchema, UpdateOrderSchema } from "@restaurant/shared";
import { authenticate, getTenantId, getUserId, getRole } from "../lib/auth.js";
import { floorStaff, cashierUp, allStaff } from "../lib/rbac.js";
import { broadcastOrderUpdate } from "./sse.js";

export default async function orderRoutes(fastify: FastifyInstance) {
  const staffAuth   = { preHandler: [authenticate, allStaff] };
  const floorAuth   = { preHandler: [authenticate, floorStaff] };
  const cashierAuth = { preHandler: [authenticate, cashierUp] };

  // List orders — all staff can view all orders (waiters see each other's orders)
  fastify.get("/api/orders", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const query = req.query as { status?: string };
    const allOrders = await db.query.orders.findMany({
      where: eq(orders.tenantId, tenantId),
      with: { items: true, table: true, user: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    const filtered = query.status ? allOrders.filter((o) => o.status === query.status) : allOrders;
    return reply.send(filtered);
  });

  // Single order — all staff can view
  fastify.get("/api/orders/:id", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)),
      with: { items: true, table: true, user: true },
    });
    if (!order) return reply.status(404).send({ message: "Order not found" });
    return reply.send(order);
  });

  // Create order — floor staff (waiters, cashiers, managers, owners)
  fastify.post("/api/orders", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const body = CreateOrderSchema.parse(req.body);

    let subtotal = 0;
    let gstAmount = 0;

    const itemDetails = await Promise.all(
      body.items.map(async (item) => {
        const [mi] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId)).limit(1);
        if (!mi) throw new Error(`Menu item ${item.menuItemId} not found`);
        if (!mi.isAvailable) throw new Error(`"${mi.name}" is not available`);
        const itemPrice = parseFloat(mi.price) * item.quantity;
        const gst = (itemPrice * parseInt(mi.gstRate)) / 100;
        subtotal += itemPrice;
        gstAmount += gst;
        return { mi, item, itemPrice };
      })
    );

    const total = subtotal + gstAmount;
    const assignedUserId = body.assignedUserId ?? userId;

    const [order] = await db
      .insert(orders)
      .values({
        tenantId,
        userId: assignedUserId,
        tableId: body.tableId,
        orderType: body.orderType,
        notes: body.notes,
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        total: total.toFixed(2),
      })
      .returning();

    await db.insert(orderItems).values(
      itemDetails.map(({ mi, item }) => ({
        orderId: order.id,
        menuItemId: mi.id,
        name: mi.name,
        price: mi.price,
        quantity: item.quantity,
        notes: item.notes,
      }))
    );

    const [kot] = await db
      .insert(kots)
      .values({ tenantId, orderId: order.id, tableId: body.tableId })
      .returning();

    await db.insert(kotItems).values(
      itemDetails.map(({ mi, item }) => ({
        kotId: kot.id,
        menuItemId: mi.id,
        name: mi.name,
        quantity: item.quantity,
        notes: item.notes,
      }))
    );

    if (body.tableId) {
      await db
        .update(restaurantTables)
        .set({ status: "occupied", currentOrderId: order.id })
        .where(eq(restaurantTables.id, body.tableId));
    }

    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: { items: true, table: true, user: true },
    });

    broadcastOrderUpdate(tenantId, { type: "order_created", orderId: order.id, kotId: kot.id });
    return reply.status(201).send(fullOrder);
  });

  // Update order — status changes require cashier+; waiter assignment open to floor staff
  fastify.put("/api/orders/:id", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const role = getRole(req);
    const body = UpdateOrderSchema.parse(req.body);

    // Waiters and kitchen staff cannot change order status
    if (body.status !== undefined && !["owner", "manager", "cashier"].includes(role)) {
      return reply.status(403).send({ message: "Only cashiers and above can change order status" });
    }

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status           !== undefined) updatePayload.status = body.status;
    if (body.notes            !== undefined) updatePayload.notes  = body.notes;
    if (body.assignedUserId   !== undefined) updatePayload.userId = body.assignedUserId;

    const [updated] = await db
      .update(orders)
      .set(updatePayload)
      .where(and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Order not found" });

    if (body.status === "billed" || body.status === "cancelled") {
      if (updated.tableId) {
        await db
          .update(restaurantTables)
          .set({ status: "available", currentOrderId: null })
          .where(eq(restaurantTables.id, updated.tableId));
      }
    }

    broadcastOrderUpdate(tenantId, { type: "order_updated", orderId: updated.id, status: updated.status });

    const full = await db.query.orders.findFirst({
      where: eq(orders.id, updated.id),
      with: { items: true, table: true, user: true },
    });
    return reply.send(full);
  });

  // Transfer table — floor staff
  fastify.post("/api/orders/:id/transfer-table", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const { newTableId } = req.body as { newTableId: number };

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)),
    });
    if (!order) return reply.status(404).send({ message: "Order not found" });

    const newTable = await db.query.restaurantTables.findFirst({
      where: and(eq(restaurantTables.id, newTableId), eq(restaurantTables.tenantId, tenantId)),
    });
    if (!newTable) return reply.status(404).send({ message: "Table not found" });
    if (newTable.status === "occupied") return reply.status(409).send({ message: "Target table is occupied" });

    if (order.tableId) {
      await db.update(restaurantTables).set({ status: "available", currentOrderId: null }).where(eq(restaurantTables.id, order.tableId));
    }
    await db.update(restaurantTables).set({ status: "occupied", currentOrderId: order.id }).where(eq(restaurantTables.id, newTableId));
    const [updated] = await db.update(orders).set({ tableId: newTableId, updatedAt: new Date() }).where(eq(orders.id, parseInt(id))).returning();
    await db.update(kots).set({ tableId: newTableId }).where(eq(kots.orderId, parseInt(id)));

    return reply.send(updated);
  });

  // Void order — cashier+
  fastify.post("/api/orders/:id/void", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };

    const [updated] = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Order not found" });

    if (updated.tableId) {
      await db.update(restaurantTables).set({ status: "available", currentOrderId: null }).where(eq(restaurantTables.id, updated.tableId));
    }

    broadcastOrderUpdate(tenantId, { type: "order_updated", orderId: updated.id, status: "cancelled" });
    return reply.send(updated);
  });
}
