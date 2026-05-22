import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { promoCodes } from "../db/schema/index.js";
import { authenticate, getTenantId } from "../lib/auth.js";
import { managerUp } from "../lib/rbac.js";
import { z } from "zod";

const CreatePromoSchema = z.object({
  code:          z.string().min(1).max(50),
  description:   z.string().optional(),
  discountType:  z.enum(["flat", "percent"]).default("flat"),
  discountValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  maxUses:       z.number().int().positive().optional(),
  expiresAt:     z.string().datetime().optional(),
});

const UpdatePromoSchema = CreatePromoSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const ValidatePromoSchema = z.object({
  code:       z.string().min(1),
  orderTotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export default async function promoCodeRoutes(fastify: FastifyInstance) {
  const managerAuth = { preHandler: [authenticate, managerUp] };
  const authOnly    = { preHandler: [authenticate] };

  fastify.get("/api/promo-codes", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const codes = await db.select().from(promoCodes).where(eq(promoCodes.tenantId, tenantId));
    return reply.send(codes);
  });

  fastify.post("/api/promo-codes", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const body = CreatePromoSchema.parse(req.body);
    const [created] = await db.insert(promoCodes).values({
      tenantId,
      code:          body.code.toUpperCase(),
      description:   body.description,
      discountType:  body.discountType,
      discountValue: body.discountValue,
      minOrderValue: body.minOrderValue ?? "0",
      maxUses:       body.maxUses,
      expiresAt:     body.expiresAt ? new Date(body.expiresAt) : null,
    }).returning();
    return reply.status(201).send(created);
  });

  fastify.put("/api/promo-codes/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    const body = UpdatePromoSchema.parse(req.body);
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.code          !== undefined) update.code          = body.code.toUpperCase();
    if (body.description   !== undefined) update.description   = body.description;
    if (body.discountType  !== undefined) update.discountType  = body.discountType;
    if (body.discountValue !== undefined) update.discountValue = body.discountValue;
    if (body.minOrderValue !== undefined) update.minOrderValue = body.minOrderValue;
    if (body.maxUses       !== undefined) update.maxUses       = body.maxUses;
    if (body.isActive      !== undefined) update.isActive      = body.isActive;
    if (body.expiresAt     !== undefined) update.expiresAt     = new Date(body.expiresAt);
    const [updated] = await db.update(promoCodes).set(update)
      .where(and(eq(promoCodes.id, parseInt(id)), eq(promoCodes.tenantId, tenantId))).returning();
    if (!updated) return reply.status(404).send({ message: "Promo code not found" });
    return reply.send(updated);
  });

  fastify.delete("/api/promo-codes/:id", managerAuth, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { id } = req.params as { id: string };
    await db.delete(promoCodes).where(and(eq(promoCodes.id, parseInt(id)), eq(promoCodes.tenantId, tenantId)));
    return reply.status(204).send();
  });

  fastify.post("/api/promo-codes/validate", authOnly, async (req, reply) => {
    const tenantId = getTenantId(req);
    const { code, orderTotal } = ValidatePromoSchema.parse(req.body);
    const [promo] = await db.select().from(promoCodes)
      .where(and(eq(promoCodes.tenantId, tenantId), eq(promoCodes.code, code.toUpperCase())))
      .limit(1);
    if (!promo)             return reply.status(404).send({ message: "Promo code not found" });
    if (!promo.isActive)    return reply.status(400).send({ message: "Promo code is inactive" });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date())
                            return reply.status(400).send({ message: "Promo code has expired" });
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
                            return reply.status(400).send({ message: "Promo code usage limit reached" });
    const total = parseFloat(orderTotal);
    const minOrder = parseFloat(promo.minOrderValue ?? "0");
    if (total < minOrder)   return reply.status(400).send({ message: `Minimum order value is ₹${minOrder}` });

    const discountValue = parseFloat(promo.discountValue);
    const discount = promo.discountType === "percent"
      ? Math.min((total * discountValue) / 100, total)
      : Math.min(discountValue, total);

    return reply.send({ valid: true, discount: discount.toFixed(2), promo });
  });
}
