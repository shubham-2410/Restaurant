import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, tenants } from "../db/schema/index.js";
import { LoginSchema, RegisterSchema } from "@restaurant/shared";
import { authenticate, getUserId, getTenantId } from "../lib/auth.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request, reply) => {
    const body = LoginSchema.parse(request.body);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user || !user.isActive) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return reply.status(401).send({ message: "Invalid credentials" });

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);

    const token = fastify.jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" }
    );

    const { passwordHash: _, ...safeUser } = user;
    return reply.send({ token, user: { ...safeUser, tenant } });
  });

  fastify.post("/api/auth/register", async (request, reply) => {
    const body = RegisterSchema.parse(request.body);

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) return reply.status(409).send({ message: "Email already registered" });

    const slug = body.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [tenant] = await db.insert(tenants).values({
      name: body.restaurantName,
      slug: `${slug}-${Date.now()}`,
      phone: body.phone,
      address: body.address,
    }).returning();

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({
      tenantId: tenant.id,
      name: body.ownerName,
      email: body.email,
      passwordHash,
      role: "owner",
    }).returning();

    const token = fastify.jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    return reply.status(201).send({ token, user: { ...safeUser, tenant } });
  });

  fastify.post("/api/auth/logout", { preHandler: [authenticate] }, async (request, reply) => {
    return reply.status(204).send();
  });

  fastify.get("/api/auth/me", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const tenantId = getTenantId(request);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const { passwordHash: _, ...safeUser } = user;
    return reply.send({ ...safeUser, tenant });
  });
}
