import type { FastifyInstance } from "fastify";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { kots, orders } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";
import { allStaff, kitchenStaff } from "../lib/rbac.js";
import { broadcastKotUpdate } from "./sse.js";

export default async function kotRoutes(fastify: FastifyInstance) {
  const staffAuth   = { preHandler: [authenticate, allStaff] };
  const kitchenAuth = { preHandler: [authenticate, kitchenStaff] };

  // GET kitchen board — only show KOTs whose order is NOT billed/cancelled
  fastify.get("/api/kot", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);

    const board = await db.query.kots.findMany({
      where: and(
        eq(kots.tenantId, tenantId),
        // exclude cancelled/done KOTs
        ne(kots.status, "cancelled"),
      ),
      with: { items: true, order: { with: { table: true } } },
      orderBy: (k, { asc, desc }) => [desc(k.isPriority), asc(k.createdAt)],
    });

    // Further filter: exclude KOTs whose parent order is billed or cancelled
    const active = board.filter(
      (k) => k.order && !["billed", "cancelled"].includes(k.order.status),
    );

    return reply.send(active);
  });

  fastify.patch("/api/kot/:id/status", kitchenAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id }   = req.params as { id: string };
    const { status } = req.body as { status: string };

    const [kot] = await db
      .update(kots)
      .set({ status: status as "pending" | "preparing" | "ready" | "cancelled", updatedAt: new Date() })
      .where(and(eq(kots.id, parseInt(id)), eq(kots.tenantId, tenantId)))
      .returning();

    if (!kot) return reply.status(404).send({ message: "KOT not found" });

    // When ALL KOTs for this order are ready → auto-advance order to "served"
    if (status === "ready") {
      const allOrderKots = await db.query.kots.findMany({
        where: and(eq(kots.orderId, kot.orderId), eq(kots.tenantId, tenantId)),
      });
      const allReady = allOrderKots.every((k) => k.status === "ready" || k.status === "cancelled");
      if (allReady) {
        await db
          .update(orders)
          .set({ status: "served", updatedAt: new Date() })
          .where(eq(orders.id, kot.orderId));
      }
    }

    broadcastKotUpdate(tenantId, { type: "kot_status", kotId: kot.id, status: kot.status, orderId: kot.orderId });
    return reply.send(kot);
  });

  fastify.patch("/api/kot/:id/priority", kitchenAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id }   = req.params as { id: string };
    const { isPriority } = req.body as { isPriority: boolean };

    const [kot] = await db
      .update(kots)
      .set({ isPriority, updatedAt: new Date() })
      .where(and(eq(kots.id, parseInt(id)), eq(kots.tenantId, tenantId)))
      .returning();

    if (!kot) return reply.status(404).send({ message: "KOT not found" });
    broadcastKotUpdate(tenantId, { type: "kot_priority", kotId: kot.id, isPriority: kot.isPriority });
    return reply.send(kot);
  });
}
