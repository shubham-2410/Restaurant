import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { kots } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function kotRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/api/kot", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const board = await db.query.kots.findMany({
      where: eq(kots.tenantId, tenantId),
      with: { items: true, order: true },
      orderBy: (k, { asc, desc }) => [desc(k.isPriority), asc(k.createdAt)],
    });
    return reply.send(board);
  });

  fastify.patch("/api/kot/:id/status", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const [kot] = await db
      .update(kots)
      .set({ status: status as "pending" | "preparing" | "ready" | "cancelled", updatedAt: new Date() })
      .where(and(eq(kots.id, parseInt(id)), eq(kots.tenantId, tenantId)))
      .returning();
    if (!kot) return reply.status(404).send({ message: "KOT not found" });
    return reply.send(kot);
  });

  fastify.patch("/api/kot/:id/priority", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const { isPriority } = req.body as { isPriority: boolean };
    const [kot] = await db
      .update(kots)
      .set({ isPriority, updatedAt: new Date() })
      .where(and(eq(kots.id, parseInt(id)), eq(kots.tenantId, tenantId)))
      .returning();
    if (!kot) return reply.status(404).send({ message: "KOT not found" });
    return reply.send(kot);
  });
}
