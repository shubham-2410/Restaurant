import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { admins } from "../../db/schema/index.js";
import { AdminCreateAdminSchema } from "@restaurant/shared";
import { authenticateAdmin, requireSuperAdmin, getAdminPayload } from "../../lib/adminAuth.js";

const superAdminAuth = { preHandler: [authenticateAdmin, requireSuperAdmin] };

export default async function adminAdminsRoutes(fastify: FastifyInstance) {
  // GET /api/admin/admins — list all admin accounts (super_admin only)
  fastify.get("/api/admin/admins", superAdminAuth, async (_req, reply) => {
    const all = await db
      .select({
        id:        admins.id,
        name:      admins.name,
        email:     admins.email,
        role:      admins.role,
        isActive:  admins.isActive,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      })
      .from(admins)
      .orderBy(admins.createdAt);

    return reply.send(all);
  });

  // POST /api/admin/admins — create new admin account (super_admin only)
  fastify.post("/api/admin/admins", superAdminAuth, async (req, reply) => {
    const body = AdminCreateAdminSchema.parse(req.body);

    const existing = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [admin] = await db
      .insert(admins)
      .values({ name: body.name, email: body.email, passwordHash, role: body.role })
      .returning();

    const { passwordHash: _, ...safeAdmin } = admin;
    return reply.status(201).send(safeAdmin);
  });

  // PATCH /api/admin/admins/:id/status — activate / deactivate admin account
  fastify.patch("/api/admin/admins/:id/status", superAdminAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };
    const { adminId } = getAdminPayload(req);

    if (parseInt(id) === adminId) {
      return reply.status(400).send({ message: "You cannot deactivate your own account" });
    }

    const [updated] = await db
      .update(admins)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(admins.id, parseInt(id)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Admin not found" });

    const { passwordHash: _, ...safe } = updated;
    return reply.send(safe);
  });

  // PUT /api/admin/admins/:id — update admin profile
  fastify.put("/api/admin/admins/:id", superAdminAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; role?: "super_admin" | "support" };

    const [updated] = await db
      .update(admins)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(admins.id, parseInt(id)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Admin not found" });

    const { passwordHash: _, ...safe } = updated;
    return reply.send(safe);
  });
}
