import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

type SseClient = { tenantId: number; raw: import("http").ServerResponse };

const clients: Set<SseClient> = new Set();

export function broadcastKotUpdate(tenantId: number, data: unknown) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.tenantId === tenantId) {
      try { client.raw.write(payload); } catch { clients.delete(client); }
    }
  }
}

export function broadcastOrderUpdate(tenantId: number, data: unknown) {
  const payload = `data: ${JSON.stringify({ ...data as object })}\n\n`;
  for (const client of clients) {
    if (client.tenantId === tenantId) {
      try { client.raw.write(payload); } catch { clients.delete(client); }
    }
  }
}

async function authenticateSse(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { token?: string };
    if (query.token) {
      request.headers["authorization"] = `Bearer ${query.token}`;
    }
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: "Unauthorized" });
  }
}

export default async function sseRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/sse/events",
    { preHandler: [authenticateSse] },
    async (request, reply) => {
      const payload = request.user as { tenantId: number };
      const tenantId = payload.tenantId;

      // Must set CORS headers manually here — reply.raw bypasses Fastify's cors plugin
      const origin = request.headers["origin"];
      const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001").split(",");
      if (origin && allowedOrigins.includes(origin)) {
        reply.raw.setHeader("Access-Control-Allow-Origin", origin);
      } else {
        reply.raw.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
      }
      reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
      reply.raw.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");
      reply.raw.flushHeaders();

      reply.raw.write(`data: ${JSON.stringify({ type: "connected", tenantId })}\n\n`);

      const client: SseClient = { tenantId, raw: reply.raw };
      clients.add(client);

      const heartbeat = setInterval(() => {
        try { reply.raw.write(": heartbeat\n\n"); } catch {
          clearInterval(heartbeat);
          clients.delete(client);
        }
      }, 25_000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        clients.delete(client);
      });

      await new Promise<void>((resolve) => request.raw.on("close", resolve));
      return reply;
    }
  );
}
