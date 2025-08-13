import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the messages for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Apple Wallet Log:', JSON.stringify(body, null, 2));
    }
    
    // Always return success - we don't want to block the pass installation
    return new NextResponse(null, { status: 200 });
    
  } catch (error) {
    // Even on error, return success to avoid blocking
    console.error('Error processing Apple log:', error);
    return new NextResponse(null, { status: 200 });
  }
}