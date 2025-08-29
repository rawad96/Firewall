import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  ENV: z.enum(["dev", "production"]).default("dev"),
  PORT: z.string().default("5000").transform(Number),
  JWT_SECRET: z.string(),
  PASSWORD_ENC_KEY: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DATABASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

const DATABASE_URL =
  env.DATABASE_URL ||
  `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@localhost:5432/${env.DB_NAME}`;

export const config = {
  ENV: env.ENV,
  PORT: env.PORT,
  JWT_SECRET: env.JWT_SECRET,
  PASSWORD_ENC_KEY : env.PASSWORD_ENC_KEY,
  DATABASE_URL,
};
