import { z } from 'zod';

const envSchema = z.object({
  PERK_API_URL: z.string().url().default('https://perk.studio'),
  PERK_BASE_URL: z.string().url().optional(),
  PERK_API_KEY: z.string().min(1),
  PERK_WEBHOOK_SECRET: z.string().min(1),
  
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  QR_SIGNING_SECRET: z.string().min(1),
  
  APPLE_PASS_TYPE_IDENTIFIER: z.string().min(1),
  APPLE_TEAM_IDENTIFIER: z.string().min(1),
  APPLE_WEB_SERVICE_URL: z.string().url(),
  APPLE_AUTH_TOKEN_SECRET: z.string().min(1),
  
  GOOGLE_WALLET_ISSUER_ID: z.string().min(1),
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_KEY: z.string().min(1),
  
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://wallet.perk.ooo'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedConfig = envSchema.parse(process.env);

export const config = {
  ...parsedConfig,
  PERK_API_URL: parsedConfig.PERK_BASE_URL || parsedConfig.PERK_API_URL,
};

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';