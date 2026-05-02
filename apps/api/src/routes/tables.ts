import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { restaurantTables } from "../db/schema/index.js";
import { TableSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function tableRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/api/tables", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const tables = await db.select().from(restaurantTables).where(eq(restaurantTables.tenantId, tenantId));
    return reply.send(tables);
  });

  fastify.post("/api/tables", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = TableSchema.parse(req.body);
    const [table] = await db.insert(restaurantTables).values({ ...body, tenantId }).returning();
    return reply.status(201).send(table);
  });

  fastify.put("/api/tables/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = TableSchema.partial().parse(req.body);
    const [table] = await db
      .update(restaurantTables)
      .set(body)
      .where(and(eq(restaurantTables.id, parseInt(id)), eq(restaurantTables.tenantId, tenantId)))
      .returning();
    if (!table) return reply.status(404).send({ message: "Table not found" });
    return reply.send(table);
  });

  fastify.delete("/api/tables/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(restaurantTables).where(and(eq(restaurantTables.id, parseInt(id)), eq(restaurantTables.tenantId, tenantId)));
    return reply.status(204).send();
  });
}
