import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate Apple Pass authentication
function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('ApplePass ')) {
    return false;
  }
  
  const token = authHeader.substring(10); // Remove "ApplePass " prefix
  const expectedToken = process.env.APPLE_AUTH_TOKEN_SECRET;
  
  return token === expectedToken;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { passTypeIdentifier: string; serialNumber: string } }
) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { serialNumber } = params;
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Find the pass by serial number
    const { data: pass, error } = await supabase
      .from('passes')
      .select('last_updated_at')
      .eq('apple_serial_number', serialNumber)
      .single();
    
    if (error || !pass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }
    
    // Return minimal response with last updated time
    // Note: We don't return the actual pass here - that's handled by /api/passes/issue
    return NextResponse.json({
      lastUpdated: pass.last_updated_at || new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching pass info:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}