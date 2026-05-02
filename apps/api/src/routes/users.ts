import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { CreateUserSchema, UpdateUserSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function userRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/api/users", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const all = await db.select({
      id: users.id, tenantId: users.tenantId, name: users.name,
      email: users.email, phone: users.phone, role: users.role,
      isActive: users.isActive, createdAt: users.createdAt, updatedAt: users.updatedAt,
    }).from(users).where(eq(users.tenantId, tenantId));
    return reply.send(all);
  });

  fastify.post("/api/users", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = CreateUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({ ...body, tenantId, passwordHash }).returning();
    const { passwordHash: _, ...safe } = user;
    return reply.status(201).send(safe);
  });

  fastify.put("/api/users/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = UpdateUserSchema.parse(req.body);
    const [user] = await db.update(users).set({ ...body, updatedAt: new Date() })
      .where(and(eq(users.id, parseInt(id)), eq(users.tenantId, tenantId))).returning();
    if (!user) return reply.status(404).send({ message: "User not found" });
    const { passwordHash: _, ...safe } = user;
    return reply.send(safe);
  });

  fastify.delete("/api/users/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(users).where(and(eq(users.id, parseInt(id)), eq(users.tenantId, tenantId)));
    return reply.status(204).send();
  });
}
