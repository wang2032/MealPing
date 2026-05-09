import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  SHOP_NAME: z.string().default('MealPing 小馆'),

  NOTIFY_CHANNEL: z.enum(['wechat_test_account', 'disabled']).default('disabled'),
  WECHAT_APP_ID: z.string().optional().default(''),
  WECHAT_APP_SECRET: z.string().optional().default(''),
  WECHAT_TEMPLATE_ID: z.string().optional().default(''),
  WECHAT_ADMIN_OPENID: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
