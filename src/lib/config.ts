import { z } from 'zod';

// During build time, we need to handle missing env vars gracefully
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL;

const envSchema = z.object({
  PERK_API_URL: z.string().url().default('https://perk.studio'),
  PERK_BASE_URL: z.string().url().optional(),
  PERK_API_KEY: isBuildTime ? z.string().optional() : z.string().min(1),
  PERK_WEBHOOK_SECRET: isBuildTime ? z.string().optional() : z.string().min(1),
  
  NEXT_PUBLIC_SUPABASE_URL: isBuildTime ? z.string().optional() : z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isBuildTime ? z.string().optional() : z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: isBuildTime ? z.string().optional() : z.string().min(1),
  
  QR_SIGNING_SECRET: isBuildTime ? z.string().optional() : z.string().min(1),
  
  APPLE_PASS_TYPE_IDENTIFIER: isBuildTime ? z.string().optional() : z.string().min(1),
  APPLE_TEAM_IDENTIFIER: isBuildTime ? z.string().optional() : z.string().min(1),
  APPLE_WEB_SERVICE_URL: isBuildTime ? z.string().optional() : z.string().url(),
  APPLE_AUTH_TOKEN_SECRET: isBuildTime ? z.string().optional() : z.string().min(1),
  
  GOOGLE_WALLET_ISSUER_ID: isBuildTime ? z.string().optional() : z.string().min(1),
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: isBuildTime ? z.string().optional() : z.string().email(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_KEY: isBuildTime ? z.string().optional() : z.string().min(1),
  
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://pass.perk.ooo'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Provide build-time defaults if env vars are missing
const defaultConfig = isBuildTime ? {
  PERK_API_URL: 'https://perk.studio',
  PERK_BASE_URL: undefined,
  PERK_API_KEY: '',
  PERK_WEBHOOK_SECRET: '',
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  QR_SIGNING_SECRET: '',
  APPLE_PASS_TYPE_IDENTIFIER: '',
  APPLE_TEAM_IDENTIFIER: '',
  APPLE_WEB_SERVICE_URL: '',
  APPLE_AUTH_TOKEN_SECRET: '',
  GOOGLE_WALLET_ISSUER_ID: '',
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: '',
  GOOGLE_WALLET_SERVICE_ACCOUNT_KEY: '',
  NEXT_PUBLIC_APP_URL: 'https://pass.perk.ooo',
  NODE_ENV: 'production' as const,
} : process.env;

const parsedConfig = envSchema.parse(defaultConfig);

export const config = {
  ...parsedConfig,
  PERK_API_URL: parsedConfig.PERK_BASE_URL || parsedConfig.PERK_API_URL || 'https://perk.studio',
} as z.infer<typeof envSchema>;

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';