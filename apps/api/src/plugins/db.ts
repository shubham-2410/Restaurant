import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { db, pool } from "../db/index.js";

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  fastify.decorate("db", db);

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
});
