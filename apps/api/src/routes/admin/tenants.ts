import type { FastifyInstance } from "fastify";
import { eq, ilike, count, sum, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { tenants, users, orders, bills } from "../../db/schema/index.js";
import { AdminCreateTenantSchema, AdminUpdateTenantSchema } from "@restaurant/shared";
import { authenticateAdmin, requireSuperAdmin } from "../../lib/adminAuth.js";
import crypto from "node:crypto";

const adminAuth     = { preHandler: [authenticateAdmin] };
const superAdminAuth = { preHandler: [authenticateAdmin, requireSuperAdmin] };

export default async function adminTenantRoutes(fastify: FastifyInstance) {
  // GET /api/admin/tenants — list all restaurants with summary stats
  fastify.get("/api/admin/tenants", adminAuth, async (req, reply) => {
    const query = req.query as { search?: string; status?: "active" | "inactive" };

    const allTenants = await db
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt);

    // Filter by search / status
    let filtered = allTenants;
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.email?.toLowerCase().includes(s) ||
          t.phone?.includes(s),
      );
    }
    if (query.status === "active")   filtered = filtered.filter((t) => t.isActive);
    if (query.status === "inactive") filtered = filtered.filter((t) => !t.isActive);

    // Attach lightweight stats per tenant
    const result = await Promise.all(
      filtered.map(async (tenant) => {
        const [userCount] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.tenantId, tenant.id));

        const [orderCount] = await db
          .select({ count: count() })
          .from(orders)
          .where(eq(orders.tenantId, tenant.id));

        const [revenue] = await db
          .select({ total: sum(bills.total) })
          .from(bills)
          .where(and(eq(bills.tenantId, tenant.id), eq(bills.paymentStatus, "paid")));

        return {
          ...tenant,
          stats: {
            users:        userCount?.count ?? 0,
            orders:       orderCount?.count ?? 0,
            totalRevenue: parseFloat(revenue?.total ?? "0"),
          },
        };
      }),
    );

    return reply.send(result);
  });

  // GET /api/admin/tenants/:id — single restaurant with full detail
  fastify.get("/api/admin/tenants/:id", adminAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const tenantId = parseInt(id);

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) return reply.status(404).send({ message: "Restaurant not found" });

    const staffList = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(users.role);

    const [orderStats] = await db
      .select({ total: count(), revenue: sum(bills.total) })
      .from(orders)
      .leftJoin(bills, and(eq(bills.orderId, orders.id), eq(bills.paymentStatus, "paid")))
      .where(eq(orders.tenantId, tenantId));

    // Revenue by last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRevenue] = await db
      .select({ total: sum(bills.total) })
      .from(bills)
      .where(
        and(
          eq(bills.tenantId, tenantId),
          eq(bills.paymentStatus, "paid"),
          sql`${bills.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
        ),
      );

    return reply.send({
      ...tenant,
      staff: staffList,
      stats: {
        totalOrders:       orderStats?.total ?? 0,
        totalRevenue:      parseFloat(orderStats?.revenue ?? "0"),
        last30DaysRevenue: parseFloat(recentRevenue?.total ?? "0"),
        staffCount:        staffList.length,
      },
    });
  });

  // POST /api/admin/tenants — create new restaurant + owner account
  fastify.post("/api/admin/tenants", superAdminAuth, async (req, reply) => {
    const body = AdminCreateTenantSchema.parse(req.body);

    // Check email uniqueness
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.ownerEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return reply.status(409).send({ message: "Owner email is already registered" });
    }

    // Build unique slug
    const baseSlug = body.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [tenant] = await db
      .insert(tenants)
      .values({
        name:      body.restaurantName,
        slug:      `${baseSlug}-${Date.now()}`,
        address:   body.address ?? null,
        phone:     body.phone ?? null,
        email:     body.email ?? null,
        gstNumber: body.gstNumber ?? null,
      })
      .returning();

    // Generate a secure temporary password
    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const [owner] = await db
      .insert(users)
      .values({
        tenantId:     tenant.id,
        name:         body.ownerName,
        email:        body.ownerEmail,
        passwordHash,
        phone:        body.ownerPhone ?? null,
        role:         "owner",
      })
      .returning();

    const { passwordHash: _, ...safeOwner } = owner;

    return reply.status(201).send({
      tenant,
      owner:             safeOwner,
      temporaryPassword,          // shown once — admin must share this with the restaurant owner
    });
  });

  // PUT /api/admin/tenants/:id — update restaurant profile
  fastify.put("/api/admin/tenants/:id", superAdminAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = AdminUpdateTenantSchema.parse(req.body);

    const [updated] = await db
      .update(tenants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tenants.id, parseInt(id)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Restaurant not found" });
    return reply.send(updated);
  });

  // PATCH /api/admin/tenants/:id/status — activate / deactivate
  fastify.patch("/api/admin/tenants/:id/status", superAdminAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };

    if (typeof isActive !== "boolean") {
      return reply.status(400).send({ message: "isActive (boolean) is required" });
    }

    const [updated] = await db
      .update(tenants)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(tenants.id, parseInt(id)))
      .returning();

    if (!updated) return reply.status(404).send({ message: "Restaurant not found" });
    return reply.send(updated);
  });
}
