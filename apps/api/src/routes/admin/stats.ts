import type { FastifyInstance } from "fastify";
import { eq, count, sum, sql, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tenants, orders, bills } from "../../db/schema/index.js";
import { authenticateAdmin } from "../../lib/adminAuth.js";

export default async function adminStatsRoutes(fastify: FastifyInstance) {
  // GET /api/admin/stats — platform-wide summary
  fastify.get(
    "/api/admin/stats",
    { preHandler: [authenticateAdmin] },
    async (_req, reply) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Total / active / inactive restaurants
      const [totalRow] = await db.select({ count: count() }).from(tenants);
      const [activeRow] = await db
        .select({ count: count() })
        .from(tenants)
        .where(eq(tenants.isActive, true));

      const totalRestaurants  = totalRow?.count ?? 0;
      const activeRestaurants = activeRow?.count ?? 0;

      // New restaurants this month
      const [newThisMonthRow] = await db
        .select({ count: count() })
        .from(tenants)
        .where(sql`${tenants.createdAt} >= ${firstOfMonth.toISOString()}`);

      // Orders today (all tenants)
      const [ordersToday] = await db
        .select({ count: count() })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${today.toISOString()}`);

      // Revenue today (all tenants, paid bills only)
      const [revenueToday] = await db
        .select({ total: sum(bills.total) })
        .from(bills)
        .where(
          and(
            eq(bills.paymentStatus, "paid"),
            sql`${bills.paidAt} >= ${today.toISOString()}`,
          ),
        );

      // Total revenue all-time
      const [totalRevenue] = await db
        .select({ total: sum(bills.total) })
        .from(bills)
        .where(eq(bills.paymentStatus, "paid"));

      // Monthly revenue for last 6 months (for chart)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const monthlyRevenue = await db
        .select({
          month:   sql<string>`TO_CHAR(${bills.paidAt}, 'YYYY-MM')`,
          revenue: sum(bills.total),
          orders:  count(),
        })
        .from(bills)
        .where(
          and(
            eq(bills.paymentStatus, "paid"),
            sql`${bills.paidAt} >= ${sixMonthsAgo.toISOString()}`,
          ),
        )
        .groupBy(sql`TO_CHAR(${bills.paidAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${bills.paidAt}, 'YYYY-MM')`);

      return reply.send({
        restaurants: {
          total:      totalRestaurants,
          active:     activeRestaurants,
          inactive:   totalRestaurants - activeRestaurants,
          newThisMonth: newThisMonthRow?.count ?? 0,
        },
        today: {
          orders:  ordersToday?.count ?? 0,
          revenue: parseFloat(revenueToday?.total ?? "0"),
        },
        allTime: {
          revenue: parseFloat(totalRevenue?.total ?? "0"),
        },
        monthlyRevenue: monthlyRevenue.map((r) => ({
          month:   r.month,
          revenue: parseFloat(r.revenue ?? "0"),
          orders:  r.orders,
        })),
      });
    },
  );
}
