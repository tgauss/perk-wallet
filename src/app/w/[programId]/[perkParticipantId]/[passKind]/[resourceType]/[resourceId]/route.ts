import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VALID_PASS_KINDS = ['loyalty', 'rewards', 'coupon', 'ticket', 'stamp', 'giftcard', 'id']

export async function GET(
  request: NextRequest,
  { params }: { 
    params: { 
      programId: string
      perkParticipantId: string
      passKind: string
      resourceType: string
      resourceId: string
    } 
  }
) {
  try {
    const perkProgramId = parseInt(params.programId, 10)
    const perkParticipantId = parseInt(params.perkParticipantId, 10)
    const { passKind, resourceType, resourceId } = params
    
    if (!perkProgramId || !perkParticipantId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }
    
    if (!VALID_PASS_KINDS.includes(passKind)) {
      return NextResponse.json({ error: 'Invalid pass kind' }, { status: 400 })
    }
    
    // Resolve internal program UUID from perk_program_id
    const { data: program } = await supabase
      .from('programs')
      .select('id, name')
      .eq('perk_program_id', perkProgramId)
      .single()
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }
    
    // Issue or update the specific pass with resource targeting
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/passes/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program_id: program.id,
        perk_participant_id: perkParticipantId,
        pass_kind: passKind,
        resource_type: resourceType,
        resource_id: resourceId,
      }),
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to issue pass' },
        { status: response.status }
      )
    }
    
    const result = await response.json()
    
    return NextResponse.json({ 
      ok: true,
      program: program.name,
      passKind,
      resource: {
        type: resourceType,
        id: resourceId
      },
      ...result
    })
  } catch (error) {
    console.error('Install error:', error)
    return NextResponse.json(
      { error: 'Failed to install pass' },
      { status: 500 }
    )
  }
}