import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseQr } from '@/lib/qr'

async function getDefaultInstallGroup(programUuid: string): Promise<string[]> {
  const { data } = await supabase
    .from('programs')
    .select('settings')
    .eq('id', programUuid)
    .single()
  
  return data?.settings?.default_install_group || ['loyalty', 'rewards']
}

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string; perkParticipantId: string } }
) {
  try {
    const perkProgramId = parseInt(params.programId, 10)
    const perkParticipantId = parseInt(params.perkParticipantId, 10)
    
    if (!perkProgramId || !perkParticipantId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
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
    
    // Get default install group
    const defaultGroup = await getDefaultInstallGroup(program.id)
    
    // Issue passes for each kind in the default group
    const results = []
    for (const passKind of defaultGroup) {
      try {
        // Call the issuance service for each pass kind
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/passes/issue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_id: program.id,
            perk_participant_id: perkParticipantId,
            pass_kind: passKind,
          }),
        })
        
        if (response.ok) {
          results.push({ passKind, status: 'success' })
        } else {
          results.push({ passKind, status: 'failed' })
        }
      } catch (error) {
        results.push({ passKind, status: 'error', error: error })
      }
    }
    
    return NextResponse.json({ 
      ok: true,
      program: program.name,
      installed: results
    })
  } catch (error) {
    console.error('Install error:', error)
    return NextResponse.json(
      { error: 'Failed to install passes' },
      { status: 500 }
    )
  }
}