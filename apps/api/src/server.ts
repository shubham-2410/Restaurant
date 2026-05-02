import Fastify from "fastify";
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

const fastify = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// Plugins
await fastify.register(helmet, { contentSecurityPolicy: false });
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
});
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? "change-this-secret-in-production",
});
await fastify.register(rateLimit, { max: 200, timeWindow: "1 minute" });

// Health check
fastify.get("/api/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
await fastify.register(authRoutes);
await fastify.register(menuRoutes);
await fastify.register(tableRoutes);
await fastify.register(orderRoutes);
await fastify.register(kotRoutes);
await fastify.register(billingRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(userRoutes);

// Error handler
fastify.setErrorHandler((error, request, reply) => {
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
  console.log(`API running at http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
