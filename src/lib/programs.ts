// Program resolver utility for dual addressing
// Keeps program UUIDs internal while using Perk Program IDs at edges

import { supabase } from './supabase'
import type { Database } from './supabase'

type Program = Database['public']['Tables']['programs']['Row']

export interface ResolvedProgram {
  program: Program
  reason: 'by_uuid' | 'by_perk_id'
}

/**
 * Resolve a program by UUID or Perk Program ID
 * - If input is a 36-char UUID, query by id
 * - If input is numeric or numeric string, query by perk_program_id
 */
export async function resolveProgram(input: string | number): Promise<ResolvedProgram | null> {
  const inputStr = String(input).trim()
  
  // Check if it's a UUID (36 characters with dashes)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputStr)
  
  if (isUuid) {
    // Query by UUID
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', inputStr)
      .maybeSingle()
    
    if (error) {
      console.error('Error resolving program by UUID:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return {
      program: data,
      reason: 'by_uuid'
    }
  } else {
    // Try to parse as Perk Program ID (numeric)
    const perkProgramId = Number(inputStr)
    
    if (isNaN(perkProgramId) || !Number.isInteger(perkProgramId)) {
      return null
    }
    
    // Query by Perk Program ID
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('perk_program_id', perkProgramId)
      .maybeSingle()
    
    if (error) {
      console.error('Error resolving program by Perk ID:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return {
      program: data,
      reason: 'by_perk_id'
    }
  }
}

/**
 * Get program by Perk Program ID specifically
 */
export async function getProgramByPerkId(perkProgramId: number): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('perk_program_id', perkProgramId)
    .maybeSingle()
  
  if (error) {
    console.error('Error getting program by Perk ID:', error)
    return null
  }
  
  return data
}

/**
 * Get program by UUID specifically
 */
export async function getProgramByUuid(programId: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle()
  
  if (error) {
    console.error('Error getting program by UUID:', error)
    return null
  }
  
  return data
}

/**
 * Backward compatibility - keep existing function
 */
export async function getProgramById(programId: string): Promise<{ id: string; perk_program_id: number; name: string } | null> {
  const program = await getProgramByUuid(programId)
  if (!program) return null
  
  return {
    id: program.id,
    perk_program_id: program.perk_program_id,
    name: program.name
  }
}

/**
 * List all programs (for admin use)
 */
export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error listing programs:', error)
    return []
  }
  
  return data || []
}

/**
 * Validate that a program exists by either UUID or Perk Program ID
 */
export async function validateProgram(input: string | number): Promise<boolean> {
  const resolved = await resolveProgram(input)
  return resolved !== null
}