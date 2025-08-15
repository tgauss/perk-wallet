// API route for template preview with merge tag resolution

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSampleParticipant, resolveLayoutForPreview } from '@/lib/preview'

// Request schema validation
const PreviewRequestSchema = z.object({
  program_id: z.string().min(1),
  draft_id: z.string().min(1),
  participant: z.object({
    perk_participant_id: z.number().optional(),
    email: z.string().optional()
  }).optional()
})

type PreviewRequest = z.infer<typeof PreviewRequestSchema>

// Response types
type PreviewResponse = 
  | { ok: true; resolved: unknown }
  | { ok: false; error: string }

export async function POST(request: NextRequest): Promise<NextResponse<PreviewResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedRequest = PreviewRequestSchema.parse(body)
    
    const { program_id, draft_id, participant: participantOpts } = validatedRequest

    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')

    // Load program data
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { ok: false, error: 'Program not found' },
        { status: 404 }
      )
    }

    // Load template draft
    const { data: draft, error: draftError } = await supabase
      .from('template_drafts')
      .select('layout')
      .eq('id', draft_id)
      .eq('program_id', program_id)
      .single()

    if (draftError || !draft) {
      return NextResponse.json(
        { ok: false, error: 'Template draft not found' },
        { status: 404 }
      )
    }

    // Get sample participant data
    const participant = await getSampleParticipant(program_id, participantOpts)

    // Create preview context
    const previewContext = {
      participant,
      program: {
        id: program.id,
        name: program.name
      }
    }

    // Resolve merge tags in layout
    const resolved = resolveLayoutForPreview(draft.layout, previewContext)

    return NextResponse.json({
      ok: true,
      resolved
    })

  } catch (error) {
    console.error('Template preview error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}