import "dotenv/config";
import { defineConfig, env } from "prisma/config";

process.env.DATABASE_URL ??=
  "postgresql://drawai:drawai@localhost:5432/drawai?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
