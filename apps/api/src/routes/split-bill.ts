import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { bills, orders, restaurantTables, kots } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";
import { cashierUp } from "../lib/rbac.js";
import { z } from "zod";

const SplitSchema = z.object({
  splits: z.array(
    z.object({
      label:         z.string().min(1),
      amount:        z.string().regex(/^\d+(\.\d{1,2})?$/),
      paymentMethod: z.enum(["cash", "card", "upi", "razorpay"]),
    }),
  ).min(2),
});

export default async function splitBillRoutes(fastify: FastifyInstance) {
  const cashierAuth = { preHandler: [authenticate, cashierUp] };

  fastify.post("/api/billing/:id/split", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id }   = req.params as { id: string };
    const { splits } = SplitSchema.parse(req.body);

    const existing = await db.query.bills.findFirst({
      where: and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)),
    });
    if (!existing)
      return reply.status(404).send({ message: "Bill not found" });
    if (existing.paymentStatus === "paid")
      return reply.status(409).send({ message: "Bill already paid" });

    const splitTotal = splits.reduce((s, sp) => s + parseFloat(sp.amount), 0);
    const billTotal  = parseFloat(existing.total);
    if (Math.abs(splitTotal - billTotal) > 0.01)
      return reply.status(400).send({
        message: `Split amounts (${splitTotal.toFixed(2)}) must equal bill total (${billTotal.toFixed(2)})`,
      });

    const [paid] = await db.update(bills)
      .set({
        paymentMethod:  splits[0].paymentMethod,
        paymentStatus:  "paid",
        paidAt:         new Date(),
      })
      .where(and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)))
      .returning();

    const order = await db.query.orders.findFirst({ where: eq(orders.id, existing.orderId) });
    await db.update(orders).set({ status: "billed", updatedAt: new Date() }).where(eq(orders.id, existing.orderId));
    await db.update(kots).set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(kots.orderId, existing.orderId), eq(kots.tenantId, tenantId)));

    if (order?.tableId) {
      await db.update(restaurantTables)
        .set({ status: "available", currentOrderId: null })
        .where(eq(restaurantTables.id, order.tableId));
    }

    return reply.send({ bill: paid, splits });
  });
}
