import { z } from 'zod'

// Server-only environment configuration
// IMPORTANT: Never import this module from client components

const ServerEnvSchema = z.object({
  // Perk API configuration
  PERK_API_URL: z.string().url().optional(),
  PERK_BASE_URL: z.string().url().optional(),
  PERK_API_KEY: z.string().optional(),
  PERK_WEBHOOK_SECRET: z.string().optional(),
  
  // Supabase service role (server-only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // QR code signing
  QR_SIGNING_SECRET: z.string().optional(),
  
  // Apple Pass configuration
  APPLE_PASS_TYPE_IDENTIFIER: z.string().optional(),
  APPLE_TEAM_IDENTIFIER: z.string().optional(),
  APPLE_WEB_SERVICE_URL: z.string().optional(),
  APPLE_AUTH_TOKEN_SECRET: z.string().optional(),
  APPLE_PASS_CERT_P12_BASE64: z.string().optional(),
  APPLE_PASS_CERT_PASSWORD: z.string().optional(),
  
  // Google Wallet configuration
  GOOGLE_WALLET_ISSUER_ID: z.string().optional(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_WALLET_SA_JSON_BASE64: z.string().optional(),
  
  // App emulator secret
  APP_EMULATOR_SECRET: z.string().optional(),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

let cachedServerEnv: ServerEnv | null = null

/**
 * Get server environment variables safely
 * Returns optional fields - no throws for missing variables
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv
  }
  
  // Use safeParse to avoid throws
  const parseResult = ServerEnvSchema.safeParse(process.env)
  
  if (parseResult.success) {
    cachedServerEnv = parseResult.data
    return parseResult.data
  }
  
  // If parse fails, return empty object with undefined values
  console.warn('Server env parsing failed:', parseResult.error.format())
  cachedServerEnv = {}
  return cachedServerEnv
}

/**
 * Check if Apple Pass configuration is complete
 */
export function checkAppleConfig(): { ready: boolean; issues: string[] } {
  const env = getServerEnv()
  const issues: string[] = []
  
  const requiredFields = [
    'APPLE_PASS_TYPE_IDENTIFIER',
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_WEB_SERVICE_URL',
    'APPLE_AUTH_TOKEN_SECRET',
    'APPLE_PASS_CERT_P12_BASE64',
    'APPLE_PASS_CERT_PASSWORD'
  ] as const
  
  for (const field of requiredFields) {
    if (!env[field]) {
      issues.push(`Missing ${field}`)
    }
  }
  
  // Try to decode the certificate if present
  if (env.APPLE_PASS_CERT_P12_BASE64) {
    try {
      const certBuffer = Buffer.from(env.APPLE_PASS_CERT_P12_BASE64, 'base64')
      if (certBuffer.length < 100) {
        issues.push('Apple certificate appears invalid (too small)')
      }
    } catch (e) {
      issues.push('Apple certificate cannot be decoded from base64')
    }
  }
  
  return {
    ready: issues.length === 0,
    issues
  }
}

/**
 * Check if Google Wallet configuration is complete
 */
export function checkGoogleConfig(): { ready: boolean; issues: string[] } {
  const env = getServerEnv()
  const issues: string[] = []
  
  if (!env.GOOGLE_WALLET_SA_JSON_BASE64) {
    issues.push('Missing GOOGLE_WALLET_SA_JSON_BASE64')
  } else {
    try {
      const saBuffer = Buffer.from(env.GOOGLE_WALLET_SA_JSON_BASE64, 'base64')
      const saJson = JSON.parse(saBuffer.toString())
      
      if (!saJson.private_key) {
        issues.push('Google service account missing private_key')
      }
      if (!saJson.client_email) {
        issues.push('Google service account missing client_email')
      }
    } catch (e) {
      issues.push('Google service account JSON cannot be decoded')
    }
  }
  
  if (!env.GOOGLE_WALLET_ISSUER_ID) {
    issues.push('Missing GOOGLE_WALLET_ISSUER_ID')
  }
  
  return {
    ready: issues.length === 0,
    issues
  }
}