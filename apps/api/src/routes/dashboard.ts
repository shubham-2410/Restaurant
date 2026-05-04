import type { FastifyInstance } from "fastify";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, restaurantTables, kots, bills } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  const staffAuth = { preHandler: [authenticate] };

  fastify.get("/api/dashboard/summary", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayBills] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${bills.total}::numeric), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(bills)
      .where(and(eq(bills.tenantId, tenantId), gte(bills.createdAt, todayStart)));

    const allTables = await db.select().from(restaurantTables).where(eq(restaurantTables.tenantId, tenantId));
    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), sql`${orders.status} NOT IN ('billed', 'cancelled')`));
    const pendingKots = await db
      .select()
      .from(kots)
      .where(and(eq(kots.tenantId, tenantId), sql`${kots.status} IN ('pending', 'preparing')`));

    return reply.send({
      todayRevenue: Number(todayBills?.total ?? 0),
      todayOrders: Number(todayBills?.count ?? 0),
      activeOrders: activeOrders.length,
      availableTables: allTables.filter((t) => t.status === "available").length,
      occupiedTables: allTables.filter((t) => t.status === "occupied").length,
      pendingKots: pendingKots.length,
    });
  });

  fastify.get("/api/dashboard/top-items", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const result = await db.execute(sql`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.price::numeric) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.tenant_id = ${tenantId}
        AND o.status NOT IN ('cancelled')
      GROUP BY oi.name
      ORDER BY total_qty DESC
      LIMIT 10
    `);
    return reply.send(result.rows);
  });

  fastify.get("/api/dashboard/hourly-revenue", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const result = await db.execute(sql`
      SELECT
        EXTRACT(HOUR FROM b.created_at) as hour,
        SUM(b.total::numeric) as revenue,
        COUNT(*) as orders
      FROM bills b
      WHERE b.tenant_id = ${tenantId}
        AND b.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `);
    return reply.send(result.rows);
  });
}
