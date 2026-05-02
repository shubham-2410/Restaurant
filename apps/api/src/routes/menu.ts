import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { menuCategories, menuItems, menuVariants, menuModifiers } from "../db/schema/index.js";
import { MenuCategorySchema, MenuItemSchema, MenuVariantSchema, MenuModifierSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";
import { managerUp, allStaff } from "../lib/rbac.js";

export default async function menuRoutes(fastify: FastifyInstance) {
  const staffAuth = { preHandler: [authenticate, allStaff] };
  const managerAuth = { preHandler: [authenticate, managerUp] };

  // ── Categories ──────────────────────────────────────────────────────────────

  fastify.get("/api/menu/categories", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const cats = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.tenantId, tenantId))
      .orderBy(menuCategories.sortOrder);
    return reply.send(cats);
  });

  fastify.post("/api/menu/categories", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = MenuCategorySchema.parse(req.body);
    const [cat] = await db.insert(menuCategories).values({ ...body, tenantId }).returning();
    return reply.status(201).send(cat);
  });

  fastify.put("/api/menu/categories/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = MenuCategorySchema.partial().parse(req.body);
    const [cat] = await db
      .update(menuCategories)
      .set(body)
      .where(and(eq(menuCategories.id, parseInt(id)), eq(menuCategories.tenantId, tenantId)))
      .returning();
    if (!cat) return reply.status(404).send({ message: "Category not found" });
    return reply.send(cat);
  });

  fastify.delete("/api/menu/categories/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(menuCategories).where(and(eq(menuCategories.id, parseInt(id)), eq(menuCategories.tenantId, tenantId)));
    return reply.status(204).send();
  });

  // ── Items ───────────────────────────────────────────────────────────────────

  fastify.get("/api/menu/items", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const items = await db.query.menuItems.findMany({
      where: eq(menuItems.tenantId, tenantId),
      with: { category: true, variants: true, modifiers: true },
      orderBy: (i, { asc }) => [asc(i.name)],
    });
    return reply.send(items);
  });

  fastify.post("/api/menu/items", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = MenuItemSchema.parse(req.body);
    const [item] = await db.insert(menuItems).values({ ...body, tenantId }).returning();
    return reply.status(201).send(item);
  });

  fastify.put("/api/menu/items/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = MenuItemSchema.partial().parse(req.body);
    const [item] = await db
      .update(menuItems)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(menuItems.id, parseInt(id)), eq(menuItems.tenantId, tenantId)))
      .returning();
    if (!item) return reply.status(404).send({ message: "Item not found" });
    return reply.send(item);
  });

  fastify.patch("/api/menu/items/:id/availability", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const { isAvailable } = req.body as { isAvailable: boolean };
    const [item] = await db
      .update(menuItems)
      .set({ isAvailable, updatedAt: new Date() })
      .where(and(eq(menuItems.id, parseInt(id)), eq(menuItems.tenantId, tenantId)))
      .returning();
    if (!item) return reply.status(404).send({ message: "Item not found" });
    return reply.send(item);
  });

  fastify.delete("/api/menu/items/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(menuItems).where(and(eq(menuItems.id, parseInt(id)), eq(menuItems.tenantId, tenantId)));
    return reply.status(204).send();
  });

  // ── Variants ────────────────────────────────────────────────────────────────

  fastify.get("/api/menu/items/:id/variants", staffAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const variants = await db.select().from(menuVariants).where(eq(menuVariants.menuItemId, parseInt(id)));
    return reply.send(variants);
  });

  fastify.post("/api/menu/items/:id/variants", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = MenuVariantSchema.parse(req.body);
    const [variant] = await db.insert(menuVariants).values({ ...body, menuItemId: parseInt(id) }).returning();
    return reply.status(201).send(variant);
  });

  fastify.put("/api/menu/variants/:id", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = MenuVariantSchema.partial().parse(req.body);
    const [variant] = await db.update(menuVariants).set(body).where(eq(menuVariants.id, parseInt(id))).returning();
    if (!variant) return reply.status(404).send({ message: "Variant not found" });
    return reply.send(variant);
  });

  fastify.delete("/api/menu/variants/:id", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.delete(menuVariants).where(eq(menuVariants.id, parseInt(id)));
    return reply.status(204).send();
  });

  // ── Modifiers ───────────────────────────────────────────────────────────────

  fastify.get("/api/menu/items/:id/modifiers", staffAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const mods = await db.select().from(menuModifiers).where(eq(menuModifiers.menuItemId, parseInt(id)));
    return reply.send(mods);
  });

  fastify.post("/api/menu/items/:id/modifiers", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = MenuModifierSchema.parse(req.body);
    const [mod] = await db.insert(menuModifiers).values({ ...body, menuItemId: parseInt(id) }).returning();
    return reply.status(201).send(mod);
  });

  fastify.put("/api/menu/modifiers/:id", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = MenuModifierSchema.partial().parse(req.body);
    const [mod] = await db.update(menuModifiers).set(body).where(eq(menuModifiers.id, parseInt(id))).returning();
    if (!mod) return reply.status(404).send({ message: "Modifier not found" });
    return reply.send(mod);
  });

  fastify.delete("/api/menu/modifiers/:id", managerAuth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.delete(menuModifiers).where(eq(menuModifiers.id, parseInt(id)));
    return reply.status(204).send();
  });
}
