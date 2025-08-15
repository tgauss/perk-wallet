import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseQr } from '@/lib/qr'
import { InstallResult, InstallResponse, tryIssuePass } from '@/lib/install-types'
import { getDefaultInstallGroup } from '@/lib/program-settings'

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string; perkParticipantId: string } }
) {
  try {
    const perkProgramId = parseInt(params.programId, 10)
    const perkParticipantId = parseInt(params.perkParticipantId, 10)
    
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
    
    // Resolve internal program UUID from perk_program_id
    const { data: program } = await supabase
      .from('programs')
      .select('id, name')
      .eq('perk_program_id', perkProgramId)
      .single()
    
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
      .select('id')
      .eq('program_id', program.id)
      .eq('perk_participant_id', perkParticipantId)
      .single()
    
    if (!participant) {
      const response: InstallResponse = {
        ok: false,
        error: 'participant_not_found',
        detail: `Participant ${perkParticipantId} not found in program`
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    // Get default install group
    const defaultGroup = await getDefaultInstallGroup(program.id)
    
    // Issue passes for each kind in the default group
    const results: InstallResult[] = []
    for (const passKind of defaultGroup) {
      const result = await tryIssuePass(program.id, perkParticipantId, passKind)
      results.push(result)
    }
    
    const response: InstallResponse = {
      ok: true,
      program: program.name,
      installed: results
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