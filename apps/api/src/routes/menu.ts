import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { menuCategories, menuItems } from "../db/schema/index.js";
import { MenuCategorySchema, MenuItemSchema } from "@restaurant/shared";
import { authenticate, getTenantId } from "../lib/auth.js";

export default async function menuRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  // Categories
  fastify.get("/api/menu/categories", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const cats = await db.select().from(menuCategories).where(eq(menuCategories.tenantId, tenantId));
    return reply.send(cats);
  });

  fastify.post("/api/menu/categories", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = MenuCategorySchema.parse(req.body);
    const [cat] = await db.insert(menuCategories).values({ ...body, tenantId }).returning();
    return reply.status(201).send(cat);
  });

  fastify.put("/api/menu/categories/:id", auth, async (req, reply) => {
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

  fastify.delete("/api/menu/categories/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(menuCategories).where(and(eq(menuCategories.id, parseInt(id)), eq(menuCategories.tenantId, tenantId)));
    return reply.status(204).send();
  });

  // Items
  fastify.get("/api/menu/items", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const items = await db.query.menuItems.findMany({
      where: eq(menuItems.tenantId, tenantId),
      with: { category: true },
    });
    return reply.send(items);
  });

  fastify.post("/api/menu/items", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = MenuItemSchema.parse(req.body);
    const [item] = await db.insert(menuItems).values({ ...body, tenantId }).returning();
    return reply.status(201).send(item);
  });

  fastify.put("/api/menu/items/:id", auth, async (req, reply) => {
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

  fastify.delete("/api/menu/items/:id", auth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(menuItems).where(and(eq(menuItems.id, parseInt(id)), eq(menuItems.tenantId, tenantId)));
    return reply.status(204).send();
  });
}
