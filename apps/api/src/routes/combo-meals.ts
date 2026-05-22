import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { comboMeals } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";
import { managerUp, allStaff } from "../lib/rbac.js";
import { z } from "zod";

const ComboItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  name:       z.string(),
  quantity:   z.number().int().positive().default(1),
});

const CreateComboSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().optional(),
  price:       z.string().regex(/^\d+(\.\d{1,2})?$/),
  imageUrl:    z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  items:       z.array(ComboItemSchema).min(1),
});

export default async function comboMealRoutes(fastify: FastifyInstance) {
  const managerAuth = { preHandler: [authenticate, managerUp] };
  const staffAuth   = { preHandler: [authenticate, allStaff] };

  fastify.get("/api/menu/combos", staffAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const combos = await db.select().from(comboMeals).where(eq(comboMeals.tenantId, tenantId));
    return reply.send(combos);
  });

  fastify.post("/api/menu/combos", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = CreateComboSchema.parse(req.body);
    const [created] = await db.insert(comboMeals).values({
      tenantId,
      name:        body.name,
      description: body.description,
      price:       body.price,
      imageUrl:    body.imageUrl || null,
      isAvailable: body.isAvailable,
      items:       body.items,
    }).returning();
    return reply.status(201).send(created);
  });

  fastify.put("/api/menu/combos/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = CreateComboSchema.partial().parse(req.body);
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name        !== undefined) update.name        = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.price       !== undefined) update.price       = body.price;
    if (body.imageUrl    !== undefined) update.imageUrl    = body.imageUrl || null;
    if (body.isAvailable !== undefined) update.isAvailable = body.isAvailable;
    if (body.items       !== undefined) update.items       = body.items;
    const [updated] = await db.update(comboMeals).set(update)
      .where(and(eq(comboMeals.id, parseInt(id)), eq(comboMeals.tenantId, tenantId))).returning();
    if (!updated) return reply.status(404).send({ message: "Combo meal not found" });
    return reply.send(updated);
  });

  fastify.delete("/api/menu/combos/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(comboMeals).where(and(eq(comboMeals.id, parseInt(id)), eq(comboMeals.tenantId, tenantId)));
    return reply.status(204).send();
  });
}
