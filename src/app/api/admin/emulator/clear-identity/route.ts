import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.delete('perk-admin-emulator')
    return response
  } catch (error) {
    console.error('Error clearing emulated identity:', error)
    return NextResponse.json({ error: 'Failed to clear identity' }, { status: 500 })
  }
}