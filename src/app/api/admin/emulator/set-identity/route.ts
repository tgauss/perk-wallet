import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { type Role } from '@/lib/auth-emulator'

function getEmulatorSecret(): Uint8Array {
  const secret = process.env.APP_EMULATOR_SECRET
  if (!secret) {
    console.warn('APP_EMULATOR_SECRET not found - using fallback secret for development')
    return new TextEncoder().encode('fallback-dev-secret-not-secure')
  }
  return new TextEncoder().encode(secret)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, programId, email } = body

    if (!role || !['super_admin', 'program_admin', 'program_editor', 'program_viewer', 'support'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate that non-super-admin roles have a program
    if (role !== 'super_admin' && !programId) {
      return NextResponse.json({ error: 'Program ID required for non-super-admin roles' }, { status: 400 })
    }

    // Create the identity object
    const identity = {
      role: role as Role,
      programId,
      email,
      isSuperAdmin: role === 'super_admin'
    }

    // Sign the JWT
    const jwt = await new SignJWT(identity)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(getEmulatorSecret())

    // Create response and set cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('perk-admin-emulator', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error setting emulated identity:', error)
    return NextResponse.json({ error: 'Failed to set identity' }, { status: 500 })
  }
}