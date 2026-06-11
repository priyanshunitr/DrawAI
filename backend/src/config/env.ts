import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://drawai:drawai@localhost:5432/drawai?schema=public"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_BUCKET: z.string().default("drawai-local"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment configuration");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};

export type Env = typeof env;
