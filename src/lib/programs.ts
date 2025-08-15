// Program utility functions

export interface Program {
  id: string
  perk_program_id: number
  name: string
}

/**
 * Get program by ID with essential fields
 */
export async function getProgramById(programId: string): Promise<Program | null> {
  try {
    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('./supabase')
    
    const { data, error } = await supabase
      .from('programs')
      .select('id, perk_program_id, name')
      .eq('id', programId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      perk_program_id: data.perk_program_id,
      name: data.name
    }
  } catch (error) {
    console.error('Failed to get program by ID:', error)
    return null
  }
}