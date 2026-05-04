import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { CreateUserSchema, UpdateUserSchema } from "@restaurant/shared";
import { authenticate, getTenantId, getUserId } from "../lib/auth.js";
import { managerUp, cashierUp, floorStaff, ownerOnly } from "../lib/rbac.js";

const SAFE_COLUMNS = {
  id: users.id,
  tenantId: users.tenantId,
  name: users.name,
  email: users.email,
  phone: users.phone,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export default async function userRoutes(fastify: FastifyInstance) {
  const floorAuth   = { preHandler: [authenticate, floorStaff] };
  const managerAuth = { preHandler: [authenticate, managerUp] };
  const ownerAuth   = { preHandler: [authenticate, ownerOnly] };

  // floorStaff: waiters need the staff list to assign themselves in POS
  fastify.get("/api/users", floorAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const all = await db.select(SAFE_COLUMNS).from(users).where(eq(users.tenantId, tenantId)).orderBy(users.name);
    return reply.send(all);
  });

  fastify.get("/api/users/me", { preHandler: [authenticate] }, async (req, reply) => {
    const userId = getUserId(req);
    const [user] = await db.select(SAFE_COLUMNS).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return reply.status(404).send({ message: "User not found" });
    return reply.send(user);
  });

  fastify.post("/api/users", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = CreateUserSchema.parse(req.body);

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) return reply.status(409).send({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({ ...body, tenantId, passwordHash }).returning();
    const { passwordHash: _, ...safe } = user;
    return reply.status(201).send(safe);
  });

  fastify.put("/api/users/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = UpdateUserSchema.parse(req.body);
    const [user] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(users.id, parseInt(id)), eq(users.tenantId, tenantId)))
      .returning();
    if (!user) return reply.status(404).send({ message: "User not found" });
    const { passwordHash: _, ...safe } = user;
    return reply.send(safe);
  });

  fastify.delete("/api/users/:id", ownerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const selfId = getUserId(req);
    if (parseInt(id) === selfId) return reply.status(400).send({ message: "Cannot delete your own account" });
    await db.delete(users).where(and(eq(users.id, parseInt(id)), eq(users.tenantId, tenantId)));
    return reply.status(204).send();
  });
}
