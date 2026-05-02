import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, orderItems, restaurantTables, menuItems, kots, kotItems } from "../db/schema/index.js";
import { CreateOrderSchema, UpdateOrderSchema } from "@restaurant/shared";
import { authenticate, getTenantId, getUserId } from "../lib/auth.js";

export default async function orderRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/api/orders", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const query = req.query as { status?: string };
    const allOrders = await db.query.orders.findMany({
      where: eq(orders.tenantId, tenantId),
      with: { items: true, table: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    const filtered = query.status ? allOrders.filter((o) => o.status === query.status) : allOrders;
    return reply.send(filtered);
  });

  fastify.get("/api/orders/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)),
      with: { items: true, table: true },
    });
    if (!order) return reply.status(404).send({ message: "Order not found" });
    return reply.send(order);
  });

  fastify.post("/api/orders", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const body = CreateOrderSchema.parse(req.body);

    let subtotal = 0;
    let gstAmount = 0;

    const itemDetails = await Promise.all(
      body.items.map(async (item) => {
        const [mi] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId)).limit(1);
        if (!mi) throw new Error(`Menu item ${item.menuItemId} not found`);
        const itemPrice = parseFloat(mi.price) * item.quantity;
        const gst = (itemPrice * parseInt(mi.gstRate)) / 100;
        subtotal += itemPrice;
        gstAmount += gst;
        return { mi, item, itemPrice };
      })
    );

    const total = subtotal + gstAmount;

    const [order] = await db
      .insert(orders)
      .values({
        tenantId,
        userId,
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

    // Auto-create KOT
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

    // Mark table as occupied
    if (body.tableId) {
      await db
        .update(restaurantTables)
        .set({ status: "occupied", currentOrderId: order.id })
        .where(eq(restaurantTables.id, body.tableId));
    }

    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: { items: true, table: true },
    });

    return reply.status(201).send(fullOrder);
  });

  fastify.put("/api/orders/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = UpdateOrderSchema.parse(req.body);

    const [updated] = await db
      .update(orders)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(orders.id, parseInt(id)), eq(orders.tenantId, tenantId)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Order not found" });

    // Free table if order done
    if (body.status === "billed" || body.status === "cancelled") {
      if (updated.tableId) {
        await db
          .update(restaurantTables)
          .set({ status: "available", currentOrderId: null })
          .where(eq(restaurantTables.id, updated.tableId));
      }
    }

    return reply.send(updated);
  });
}
