import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { buildQr } from '@/lib/qr'
import { PASS_KINDS, PassKind } from '@/lib/program-settings'

const DiagnosticsRequestSchema = z.object({
  perk_program_id: z.number(),
  perk_participant_id: z.number(),
  kinds: z.array(z.enum(['loyalty', 'rewards', 'coupon', 'ticket', 'stamp', 'giftcard', 'id'])).optional(),
  resource: z.object({
    type: z.string(),
    id: z.string()
  }).optional()
})

type DiagnosticCheck = {
  kind: string
  published_template: boolean
  apple_ready: boolean
  google_ready: boolean
  assets_ok: boolean
  qr_preview: string
  issues: string[]
}

// Check if Apple configuration is present and valid
function checkAppleConfig(): { ready: boolean; issues: string[] } {
  const issues: string[] = []
  
  const requiredEnvVars = [
    'APPLE_PASS_TYPE_IDENTIFIER',
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_WEB_SERVICE_URL',
    'APPLE_AUTH_TOKEN_SECRET',
    'APPLE_PASS_CERT_P12_BASE64',
    'APPLE_PASS_CERT_PASSWORD'
  ]
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing ${envVar}`)
    }
  }
  
  // Try to decode the certificate
  if (process.env.APPLE_PASS_CERT_P12_BASE64) {
    try {
      const certBuffer = Buffer.from(process.env.APPLE_PASS_CERT_P12_BASE64, 'base64')
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

// Check if Google Wallet configuration is present and valid
function checkGoogleConfig(): { ready: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (!process.env.GOOGLE_WALLET_SA_JSON_BASE64) {
    issues.push('Missing GOOGLE_WALLET_SA_JSON_BASE64')
  } else {
    try {
      const saBuffer = Buffer.from(process.env.GOOGLE_WALLET_SA_JSON_BASE64, 'base64')
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
  
  if (!process.env.GOOGLE_WALLET_ISSUER_ID) {
    issues.push('Missing GOOGLE_WALLET_ISSUER_ID')
  }
  
  return {
    ready: issues.length === 0,
    issues
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      perk_program_id, 
      perk_participant_id, 
      kinds,
      resource 
    } = DiagnosticsRequestSchema.parse(body)
    
    // Resolve program
    const { data: program } = await supabase
      .from('programs')
      .select('id, name, settings')
      .eq('perk_program_id', perk_program_id)
      .single()
    
    if (!program) {
      return NextResponse.json({
        ok: false,
        error: 'Program not found',
        program: null,
        participant: { exists: false },
        checks: []
      })
    }
    
    // Check if participant exists
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('program_id', program.id)
      .eq('perk_participant_id', perk_participant_id)
      .single()
    
    const participantExists = !!participant
    
    // Get default install group from program settings
    const defaultGroup = program.settings?.default_install_group || ['loyalty', 'rewards']
    
    // Use provided kinds or default group
    const kindsToCheck = kinds && kinds.length > 0 ? kinds : defaultGroup
    
    // Check Apple and Google configs once
    const appleConfig = checkAppleConfig()
    const googleConfig = checkGoogleConfig()
    
    // Run checks for each kind
    const checks: DiagnosticCheck[] = []
    
    for (const kind of kindsToCheck) {
      const issues: string[] = []
      
      // Check for published template
      const { data: template } = await supabase
        .from('templates')
        .select('id, apple_template, google_template')
        .eq('program_id', program.id)
        .eq('pass_kind', kind)
        .eq('is_active', true)
        .single()
      
      const hasTemplate = !!template
      if (!hasTemplate) {
        issues.push(`No published template for ${kind}`)
      }
      
      // Check template assets (simplified - just check if templates have basic structure)
      let assetsOk = false
      if (template) {
        // For Apple, check if template has minimal required fields
        const appleTemplate = template.apple_template as any
        const googleTemplate = template.google_template as any
        
        assetsOk = true
        if (appleTemplate && !appleTemplate.formatVersion) {
          assetsOk = false
          issues.push('Apple template missing formatVersion')
        }
        if (googleTemplate && !googleTemplate.classId) {
          assetsOk = false
          issues.push('Google template missing classId')
        }
      }
      
      // Build QR preview
      const qrPreview = buildQr({
        programId: perk_program_id,
        perkParticipantId: perk_participant_id,
        passKind: kind as PassKind,
        resourceType: resource?.type,
        resourceId: resource?.id
      })
      
      // Combine Apple/Google issues if template exists
      if (hasTemplate) {
        if (!appleConfig.ready) {
          issues.push(...appleConfig.issues.map(i => `Apple: ${i}`))
        }
        if (!googleConfig.ready) {
          issues.push(...googleConfig.issues.map(i => `Google: ${i}`))
        }
      }
      
      checks.push({
        kind,
        published_template: hasTemplate,
        apple_ready: hasTemplate && appleConfig.ready,
        google_ready: hasTemplate && googleConfig.ready,
        assets_ok: assetsOk,
        qr_preview: qrPreview,
        issues
      })
    }
    
    return NextResponse.json({
      ok: true,
      program: {
        id: program.id,
        name: program.name,
        default_group: defaultGroup
      },
      participant: {
        exists: participantExists
      },
      checks
    })
    
  } catch (error) {
    console.error('Diagnostics error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request',
        detail: error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }
    
    return NextResponse.json({
      ok: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}