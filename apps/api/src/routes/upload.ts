import type { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticate } from "../lib/auth.js";
import { allStaff } from "../lib/rbac.js";

export default async function uploadRoutes(fastify: FastifyInstance) {
  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  fastify.post(
    "/api/uploads",
    { preHandler: [authenticate, allStaff] },
    async (req, reply) => {
      const data = await req.file();
      if (!data) return reply.status(400).send({ message: "No file uploaded" });

      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(data.mimetype)) {
        return reply.status(400).send({ message: "Only JPEG, PNG, WebP and GIF are allowed" });
      }

      const ext      = path.extname(data.filename) || ".jpg";
      const filename = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, await data.toBuffer());

      const baseUrl = process.env.API_BASE_URL ?? "";
      return reply.status(201).send({ url: `${baseUrl}/api/uploads/${filename}` });
    },
  );
}
