import 'dotenv/config'
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import tableRoutes from "./routes/tables.js";
import orderRoutes from "./routes/orders.js";
import kotRoutes from "./routes/kot.js";
import billingRoutes from "./routes/billing.js";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/users.js";
import sseRoutes from "./routes/sse.js";

// Admin routes
import adminAuthRoutes from "./routes/admin/auth.js";
import adminTenantRoutes from "./routes/admin/tenants.js";
import adminStatsRoutes from "./routes/admin/stats.js";
import adminAdminsRoutes from "./routes/admin/admins.js";

const fastify = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

await fastify.register(helmet, { contentSecurityPolicy: false });
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [
        "http://localhost:3000",  // web app
        "http://localhost:3001",  // admin app
      ],
  credentials: true,
});
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? "change-this-secret-in-production",
});
await fastify.register(rateLimit, { max: 300, timeWindow: "1 minute" });

fastify.get("/api/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

// Restaurant routes
await fastify.register(authRoutes);
await fastify.register(menuRoutes);
await fastify.register(tableRoutes);
await fastify.register(orderRoutes);
await fastify.register(kotRoutes);
await fastify.register(billingRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(userRoutes);
await fastify.register(sseRoutes);

// Admin routes (platform-level)
await fastify.register(adminAuthRoutes);
await fastify.register(adminTenantRoutes);
await fastify.register(adminStatsRoutes);
await fastify.register(adminAdminsRoutes);

fastify.setErrorHandler((error: FastifyError, _request, reply) => {
  if (error.name === "ZodError") {
    return reply.status(400).send({ message: "Validation error", errors: JSON.parse(error.message) });
  }
  fastify.log.error(error);
  reply.status(error.statusCode ?? 500).send({ message: error.message ?? "Internal server error" });
});

const PORT = parseInt(process.env.PORT ?? "4000");
const HOST = process.env.HOST ?? "0.0.0.0";

try {
  await fastify.listen({ port: PORT, host: HOST });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
