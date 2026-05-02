import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: "Unauthorized" });
  }
}

export function getUserId(request: FastifyRequest): number {
  const payload = request.user as { userId: number; tenantId: number; role: string };
  return payload.userId;
}

export function getTenantId(request: FastifyRequest): number {
  const payload = request.user as { userId: number; tenantId: number; role: string };
  return payload.tenantId;
}

export function getRole(request: FastifyRequest): string {
  const payload = request.user as { userId: number; tenantId: number; role: string };
  return payload.role;
}
