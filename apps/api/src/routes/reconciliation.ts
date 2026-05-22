import type { FastifyInstance } from "fastify";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { dayEndReconciliations, bills, orders } from "../db/schema/index.js";
import { authenticate, getTenantId, getUserId } from "../lib/auth.js";
import { managerUp, cashierUp } from "../lib/rbac.js";
import { z } from "zod";

const CloseSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export default async function reconciliationRoutes(fastify: FastifyInstance) {
  const cashierAuth = { preHandler: [authenticate, cashierUp] };
  const managerAuth = { preHandler: [authenticate, managerUp] };

  fastify.get("/api/reconciliation", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const rows = await db.select().from(dayEndReconciliations)
      .where(eq(dayEndReconciliations.tenantId, tenantId))
      .orderBy(sql`${dayEndReconciliations.date} DESC`);
    return reply.send(rows);
  });

  fastify.get("/api/reconciliation/:date", cashierAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { date } = req.params as { date: string };

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd   = new Date(`${date}T23:59:59.999Z`);

    const dayBills = await db.query.bills.findMany({
      where: and(
        eq(bills.tenantId, tenantId),
        eq(bills.paymentStatus, "paid"),
        gte(bills.paidAt, dayStart),
        lte(bills.paidAt, dayEnd),
      ),
      with: { order: true },
    });

    const dayOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, dayStart),
        lte(orders.createdAt, dayEnd),
      ),
    });

    const totals = {
      totalOrders:        dayOrders.length,
      totalRevenue:       0,
      cashRevenue:        0,
      cardRevenue:        0,
      upiRevenue:         0,
      razorpayRevenue:    0,
      totalGst:           0,
      totalDiscount:      0,
      complimentaryCount: 0,
    };

    for (const b of dayBills) {
      const t = parseFloat(b.total);
      const d = parseFloat(b.discount ?? "0");
      totals.totalRevenue  += t;
      totals.totalDiscount += d;
      totals.totalGst      += parseFloat(b.gstAmount);
      if (b.paymentMethod === "cash")     totals.cashRevenue     += t;
      if (b.paymentMethod === "card")     totals.cardRevenue     += t;
      if (b.paymentMethod === "upi")      totals.upiRevenue      += t;
      if (b.paymentMethod === "razorpay") totals.razorpayRevenue += t;
    }

    for (const o of dayOrders) {
      if ((o as typeof o & { isComplimentary?: boolean }).isComplimentary) {
        totals.complimentaryCount++;
      }
    }

    return reply.send({ date, ...totals, bills: dayBills });
  });

  fastify.post("/api/reconciliation/close", cashierAuth, async (req, reply) => {
    const tenantId    = getTenantId(req);
    const userId      = getUserId(req);
    const { date, notes } = CloseSchema.parse(req.body);

    const existing = await db.query.dayEndReconciliations.findFirst({
      where: and(
        eq(dayEndReconciliations.tenantId, tenantId),
        eq(dayEndReconciliations.date, date),
      ),
    });
    if (existing) return reply.status(409).send({ message: "Day already closed for this date" });

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd   = new Date(`${date}T23:59:59.999Z`);

    const dayBills = await db.query.bills.findMany({
      where: and(
        eq(bills.tenantId, tenantId),
        eq(bills.paymentStatus, "paid"),
        gte(bills.paidAt, dayStart),
        lte(bills.paidAt, dayEnd),
      ),
    });

    const dayOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, dayStart),
        lte(orders.createdAt, dayEnd),
      ),
    });

    let totalRevenue = 0, cashRevenue = 0, cardRevenue = 0, upiRevenue = 0, razorpayRevenue = 0;
    let totalGst = 0, totalDiscount = 0;

    for (const b of dayBills) {
      const t = parseFloat(b.total);
      totalRevenue  += t;
      totalDiscount += parseFloat(b.discount ?? "0");
      totalGst      += parseFloat(b.gstAmount);
      if (b.paymentMethod === "cash")     cashRevenue     += t;
      if (b.paymentMethod === "card")     cardRevenue     += t;
      if (b.paymentMethod === "upi")      upiRevenue      += t;
      if (b.paymentMethod === "razorpay") razorpayRevenue += t;
    }

    const complimentaryCount = dayOrders.filter(
      (o) => (o as typeof o & { isComplimentary?: boolean }).isComplimentary,
    ).length;

    const [record] = await db.insert(dayEndReconciliations).values({
      tenantId,
      closedByUserId:    userId,
      date,
      totalOrders:       dayOrders.length,
      totalRevenue:      totalRevenue.toFixed(2),
      cashRevenue:       cashRevenue.toFixed(2),
      cardRevenue:       cardRevenue.toFixed(2),
      upiRevenue:        upiRevenue.toFixed(2),
      razorpayRevenue:   razorpayRevenue.toFixed(2),
      totalGst:          totalGst.toFixed(2),
      totalDiscount:     totalDiscount.toFixed(2),
      complimentaryCount,
      notes,
    }).returning();

    return reply.status(201).send(record);
  });
}
