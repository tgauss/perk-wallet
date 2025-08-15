import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { buildQr } from '@/lib/qr'
import { PASS_KINDS, PassKind } from '@/lib/program-settings'
import { checkAppleConfig, checkGoogleConfig } from '@/lib/config.server'

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
        .select('id, layout')
        .eq('program_id', program.id)
        .eq('pass_kind', kind)
        .single()
      
      const hasTemplate = !!template
      if (!hasTemplate) {
        issues.push(`No published template for ${kind}`)
      }
      
      // Check template assets (simplified - just check if layout has basic structure)
      let assetsOk = false
      if (template) {
        const layout = template.layout as any
        assetsOk = true
        
        // Basic validation - check if layout has required structure
        if (!layout || typeof layout !== 'object') {
          assetsOk = false
          issues.push('Template layout missing or invalid')
        } else {
          // Check for Apple/Google specific configs in layout
          if (layout.apple && !layout.apple.formatVersion) {
            issues.push('Apple template missing formatVersion')
          }
          if (layout.google && !layout.google.classId) {
            issues.push('Google template missing classId')
          }
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