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

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string } }
) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { pushToken } = body;
    
    if (!pushToken) {
      return NextResponse.json({ error: 'Missing pushToken' }, { status: 400 });
    }
    
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Find the pass by serial number
    const { data: pass, error: passError } = await supabase
      .from('passes')
      .select('apple_device_tokens')
      .eq('apple_serial_number', serialNumber)
      .single();
    
    if (passError || !pass) {
      // Pass not found, but Apple expects 201 anyway
      return NextResponse.json({ updated: true }, { status: 201 });
    }
    
    // Update device tokens array
    let deviceTokens = pass.apple_device_tokens || [];
    
    // Create device token object
    const deviceToken = {
      deviceLibraryIdentifier,
      pushToken,
      registeredAt: new Date().toISOString()
    };
    
    // Remove any existing token for this device
    deviceTokens = deviceTokens.filter((t: any) => 
      t.deviceLibraryIdentifier !== deviceLibraryIdentifier
    );
    
    // Add the new token
    deviceTokens.push(deviceToken);
    
    // Update the pass
    const { error: updateError } = await supabase
      .from('passes')
      .update({ 
        apple_device_tokens: deviceTokens,
        last_updated_at: new Date().toISOString()
      })
      .eq('apple_serial_number', serialNumber);
    
    if (updateError) {
      console.error('Error updating device tokens:', updateError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    
    return NextResponse.json({ updated: true }, { status: 201 });
    
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string } }
) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { deviceLibraryIdentifier, serialNumber } = params;
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Find the pass by serial number
    const { data: pass, error: passError } = await supabase
      .from('passes')
      .select('apple_device_tokens')
      .eq('apple_serial_number', serialNumber)
      .single();
    
    if (passError || !pass) {
      // Pass not found, but return success
      return new NextResponse(null, { status: 200 });
    }
    
    // Update device tokens array
    let deviceTokens = pass.apple_device_tokens || [];
    
    // Remove token for this device
    deviceTokens = deviceTokens.filter((t: any) => 
      t.deviceLibraryIdentifier !== deviceLibraryIdentifier
    );
    
    // Update the pass
    const { error: updateError } = await supabase
      .from('passes')
      .update({ 
        apple_device_tokens: deviceTokens,
        last_updated_at: new Date().toISOString()
      })
      .eq('apple_serial_number', serialNumber);
    
    if (updateError) {
      console.error('Error removing device token:', updateError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    
    return new NextResponse(null, { status: 200 });
    
  } catch (error) {
    console.error('Error unregistering device:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}