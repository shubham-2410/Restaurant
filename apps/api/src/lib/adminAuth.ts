import type { FastifyRequest, FastifyReply } from "fastify";

export interface AdminTokenPayload {
  adminId: number;
  role: "super_admin" | "support";
  type: "admin";
}

/**
 * Middleware — verifies the request carries a valid admin JWT.
 * Admin tokens always have `type === "admin"` in the payload.
 */
export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as AdminTokenPayload;

    if (payload.type !== "admin") {
      return reply.status(403).send({ message: "Admin access required" });
    }
  } catch {
    return reply.status(401).send({ message: "Unauthorized" });
  }
}

/**
 * Middleware — only super_admin role can proceed.
 */
export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as AdminTokenPayload;
  if (payload.role !== "super_admin") {
    return reply.status(403).send({ message: "Super admin access required" });
  }
}

export function getAdminPayload(request: FastifyRequest): AdminTokenPayload {
  return request.user as AdminTokenPayload;
}
