import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { admins } from "../../db/schema/index.js";
import { AdminLoginSchema } from "@restaurant/shared";
import { authenticateAdmin, getAdminPayload } from "../../lib/adminAuth.js";

export default async function adminAuthRoutes(fastify: FastifyInstance) {
  // POST /api/admin/auth/login
  fastify.post("/api/admin/auth/login", async (request, reply) => {
    const body = AdminLoginSchema.parse(request.body);

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, body.email))
      .limit(1);

    if (!admin || !admin.isActive) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!valid) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    // type: "admin" distinguishes this token from restaurant user tokens
    const token = fastify.jwt.sign(
      { adminId: admin.id, role: admin.role, type: "admin" },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    );

    const { passwordHash: _, ...safeAdmin } = admin;
    return reply.send({ token, admin: safeAdmin });
  });

  // GET /api/admin/auth/me
  fastify.get(
    "/api/admin/auth/me",
    { preHandler: [authenticateAdmin] },
    async (request, reply) => {
      const { adminId } = getAdminPayload(request);
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, adminId))
        .limit(1);

      if (!admin) return reply.status(404).send({ message: "Admin not found" });

      const { passwordHash: _, ...safeAdmin } = admin;
      return reply.send(safeAdmin);
    },
  );
}
