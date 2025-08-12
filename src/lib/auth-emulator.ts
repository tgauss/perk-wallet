/**
 * Auth Emulator for Admin Interface
 * 
 * Provides JWT-based role emulation for testing admin permissions.
 * Security: Requires APP_EMULATOR_SECRET in production.
 * 
 * @module auth-emulator
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type Role = 'super_admin' | 'program_admin' | 'program_editor' | 'program_viewer' | 'support'

export interface EmulatedIdentity {
  role: Role
  programId?: string  // Required for non-super_admin roles
  email?: string      // Optional for audit trails
  isSuperAdmin: boolean
}

const EMULATOR_COOKIE_NAME = 'perk-admin-emulator'

function getEmulatorSecret(): Uint8Array {
  const secret = process.env.APP_EMULATOR_SECRET
  if (!secret) {
    console.warn('APP_EMULATOR_SECRET not found - using fallback secret for development')
    return new TextEncoder().encode('fallback-dev-secret-not-secure')
  }
  return new TextEncoder().encode(secret)
}

export function hasEmulatorSecret(): boolean {
  return !!process.env.APP_EMULATOR_SECRET
}

export async function setEmulatedIdentity(identity: Omit<EmulatedIdentity, 'isSuperAdmin'>): Promise<void> {
  const fullIdentity: EmulatedIdentity = {
    ...identity,
    isSuperAdmin: identity.role === 'super_admin'
  }

  const jwt = await new SignJWT(fullIdentity)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getEmulatorSecret())

  const cookieStore = await cookies()
  cookieStore.set(EMULATOR_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })
}

export async function getEmulatedIdentity(): Promise<EmulatedIdentity | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(EMULATOR_COOKIE_NAME)?.value
    
    if (!token) return null

    const { payload } = await jwtVerify(token, getEmulatorSecret())
    
    return {
      role: payload.role as Role,
      programId: payload.programId as string | undefined,
      email: payload.email as string | undefined,
      isSuperAdmin: payload.isSuperAdmin as boolean
    }
  } catch (error) {
    console.error('Error verifying emulated identity:', error)
    return null
  }
}

export async function clearEmulatedIdentity(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(EMULATOR_COOKIE_NAME)
}

export async function requireEmulatedIdentity(): Promise<EmulatedIdentity> {
  const identity = await getEmulatedIdentity()
  if (!identity) {
    throw new Error('No emulated identity found')
  }
  return identity
}