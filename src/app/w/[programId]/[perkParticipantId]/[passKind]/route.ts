import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { InstallResult, InstallResponse, tryIssuePass } from '@/lib/install-types'
import { PASS_KINDS } from '@/lib/program-settings'
import { getProgramByPerkId } from '@/lib/programs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string; perkParticipantId: string; passKind: string }> }
) {
  try {
    const resolvedParams = await params
    const perkProgramId = parseInt(resolvedParams.programId, 10)
    const perkParticipantId = parseInt(resolvedParams.perkParticipantId, 10)
    const passKind = resolvedParams.passKind
    
    if (!perkProgramId || perkProgramId <= 0) {
      const response: InstallResponse = {
        ok: false,
        error: 'invalid_scope',
        detail: 'Invalid program ID'
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    if (!perkParticipantId || perkParticipantId <= 0) {
      const response: InstallResponse = {
        ok: false,
        error: 'invalid_scope',
        detail: 'Invalid participant ID'
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    if (!PASS_KINDS.includes(passKind as any)) {
      const response: InstallResponse = {
        ok: false,
        error: 'invalid_scope',
        detail: `Invalid pass kind: ${passKind}`
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    // Resolve internal program UUID from perk_program_id
    const program = await getProgramByPerkId(perkProgramId)
    
    if (!program) {
      const response: InstallResponse = {
        ok: false,
        error: 'invalid_scope',
        detail: 'Program not found'
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    // Check if participant exists
    const { data: participant } = await supabase
      .from('participants')
      .select('perk_participant_id')
      .eq('program_id', program.id)
      .eq('perk_participant_id', perkParticipantId)
      .maybeSingle()
    
    if (!participant) {
      const response: InstallResponse = {
        ok: false,
        error: 'participant_not_found',
        detail: `Participant ${perkParticipantId} not found in program`
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    // Issue or update the specific pass kind
    const result = await tryIssuePass(program.id, perkParticipantId, passKind)
    
    const response: InstallResponse = {
      ok: true,
      program: program.name,
      installed: [result]
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Install error:', error)
    const response: InstallResponse = {
      ok: false,
      error: 'provider_error',
      detail: error instanceof Error ? error.message : 'Internal server error'
    }
    return NextResponse.json(response, { status: 500 })
  }
}