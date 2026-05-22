import type { FastifyInstance } from "fastify";
import { authenticate, getTenantId } from "../lib/auth.js";
import { cashierUp } from "../lib/rbac.js";
import { z } from "zod";

let razorpayInstance: {
  orders: { create: (opts: Record<string, unknown>) => Promise<{ id: string; amount: number; currency: string }> };
} | null = null;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");
  // Lazy dynamic import to avoid crashing when creds are absent
  const Razorpay = require("razorpay");
  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret }) as typeof razorpayInstance;
  return razorpayInstance!;
}

const CreateOrderSchema = z.object({
  amount:   z.number().positive(),
  currency: z.string().length(3).default("INR"),
  receipt:  z.string().optional(),
});

export default async function razorpayRoutes(fastify: FastifyInstance) {
  const cashierAuth = { preHandler: [authenticate, cashierUp] };

  fastify.post("/api/razorpay/create-order", cashierAuth, async (req, reply) => {
    getTenantId(req);
    const { amount, currency, receipt } = CreateOrderSchema.parse(req.body);
    try {
      const rz    = getRazorpay();
      const order = await rz.orders.create({
        amount:   Math.round(amount * 100),
        currency,
        receipt:  receipt ?? `rcpt_${Date.now()}`,
      });
      return reply.send({
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Razorpay error";
      return reply.status(502).send({ message: msg });
    }
  });
}
