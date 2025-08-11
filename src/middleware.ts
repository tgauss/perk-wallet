import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getEmulatorSecret(): Uint8Array {
  const secret = process.env.APP_EMULATOR_SECRET
  if (!secret) {
    return new TextEncoder().encode('fallback-dev-secret-not-secure')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware for debugging
  return NextResponse.next()
  
  // Only apply to admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow access to emulator page without authentication
  if (request.nextUrl.pathname === '/admin/emulator') {
    return NextResponse.next()
  }

  // Check for emulated identity cookie
  const token = request.cookies.get('perk-admin-emulator')?.value
  
  if (!token) {
    // Redirect to emulator page if no identity is set
    return NextResponse.redirect(new URL('/admin/emulator', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, getEmulatorSecret())
    
    // Add identity headers for server components and actions
    const response = NextResponse.next()
    response.headers.set('x-emulated-role', payload.role as string)
    response.headers.set('x-emulated-program', payload.programId as string || '')
    response.headers.set('x-emulated-email', payload.email as string || '')
    response.headers.set('x-is-super-admin', payload.isSuperAdmin ? 'true' : 'false')
    
    return response
  } catch (error) {
    console.error('Invalid emulated identity token:', error)
    // Redirect to emulator page if token is invalid
    return NextResponse.redirect(new URL('/admin/emulator', request.url))
  }
}

export const config = {
  matcher: '/admin/:path*'
}