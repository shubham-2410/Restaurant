import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { bills, orders } from "../db/schema/index.js";
import { RecordPaymentSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function billingRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/api/billing", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const allBills = await db.query.bills.findMany({
      where: eq(bills.tenantId, tenantId),
      with: { order: true },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
    return reply.send(allBills);
  });

  fastify.get("/api/billing/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)),
      with: { order: { with: { items: true, table: true } } },
    });
    if (!bill) return reply.status(404).send({ message: "Bill not found" });
    return reply.send(bill);
  });

  fastify.post("/api/billing/order/:orderId", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { orderId } = req.params as { orderId: string };
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, parseInt(orderId)), eq(orders.tenantId, tenantId)),
      with: { items: true },
    });
    if (!order) return reply.status(404).send({ message: "Order not found" });

    const count = await db.select().from(bills).where(eq(bills.tenantId, tenantId));
    const billNumber = `BILL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(count.length + 1).padStart(4, "0")}`;

    const [bill] = await db
      .insert(bills)
      .values({
        tenantId,
        orderId: order.id,
        billNumber,
        subtotal: order.subtotal,
        gstBreakdown: {},
        gstAmount: order.gstAmount,
        total: order.total,
      })
      .returning();

    return reply.status(201).send(bill);
  });

  fastify.post("/api/billing/:id/payment", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = RecordPaymentSchema.parse(req.body);

    const [bill] = await db
      .update(bills)
      .set({
        paymentMethod: body.paymentMethod,
        paymentStatus: "paid",
        discount: body.discount ?? "0",
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
        paidAt: new Date(),
      })
      .where(and(eq(bills.id, parseInt(id)), eq(bills.tenantId, tenantId)))
      .returning();

    if (!bill) return reply.status(404).send({ message: "Bill not found" });
    return reply.send(bill);
  });
}
