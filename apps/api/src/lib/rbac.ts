import type { FastifyRequest, FastifyReply } from "fastify";

export type Role = "owner" | "manager" | "cashier" | "waiter" | "kitchen";

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { userId: number; tenantId: number; role: Role };
    if (!roles.includes(payload.role)) {
      return reply.status(403).send({ message: "Forbidden: insufficient permissions" });
    }
  };
}

export const ownerOnly = requireRole("owner");
export const managerUp = requireRole("owner", "manager");
export const cashierUp = requireRole("owner", "manager", "cashier");
export const allStaff = requireRole("owner", "manager", "cashier", "waiter", "kitchen");
export const kitchenStaff = requireRole("owner", "manager", "kitchen");
export const floorStaff = requireRole("owner", "manager", "cashier", "waiter");
