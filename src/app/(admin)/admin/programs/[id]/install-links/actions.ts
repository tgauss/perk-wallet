'use server'

import { revalidatePath } from 'next/cache'
import { getProgramById } from '@/lib/programs'
import { PassKind } from '@/lib/program-settings'
import { getAppUrl } from '@/lib/config.public'

// Types
export type InstallLinkResult = 
  | { ok: true; url: string }
  | { ok: false; error: string }

export type ParticipantLookupResult =
  | { ok: true; perkParticipantId: number; email: string; status: string | null; unused_points: number }
  | { ok: false; error: string }

/**
 * Create or update an install link for a participant
 */
export async function upsertInstallLink(
  programId: string,
  perkParticipantId: number,
  options?: {
    passKind?: PassKind
    resourceType?: string
    resourceId?: string
    templateId?: string
  }
): Promise<InstallLinkResult> {
  try {
    // Get program info to build URL
    const program = await getProgramById(programId)
    if (!program) {
      return { ok: false, error: 'Program not found' }
    }

    // Build canonical URL based on options
    const appUrl = getAppUrl()
    let url = `${appUrl}/w/${program.perk_program_id}/${perkParticipantId}`
    
    if (options?.passKind) {
      url += `/${options.passKind}`
      
      if (options.resourceType && options.resourceId) {
        url += `/${options.resourceType}/${options.resourceId}`
      }
    }

    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')

    // Upsert install link
    const { error } = await supabase
      .from('install_links')
      .upsert({
        program_id: programId,
        perk_participant_id: perkParticipantId,
        pass_kind: options?.passKind || 'loyalty',
        template_id: options?.templateId || null,
        resource_type: options?.resourceType || null,
        resource_id: options?.resourceId || null,
        url: url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'program_id,perk_participant_id,pass_kind,resource_type,resource_id'
      })

    if (error) {
      return { ok: false, error: `Failed to save install link: ${error.message}` }
    }

    // Revalidate the page
    revalidatePath(`/admin/programs/${programId}/install-links`)

    return { ok: true, url }

  } catch (error) {
    console.error('Failed to upsert install link:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to create install link'
    }
  }
}

/**
 * Get existing install link or create new one
 */
export async function getInstallLink(
  programId: string,
  perkParticipantId: number,
  options?: {
    passKind?: PassKind
    resourceType?: string
    resourceId?: string
  }
): Promise<InstallLinkResult> {
  try {
    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')

    // Try to get existing link
    let query = supabase
      .from('install_links')
      .select('url')
      .eq('program_id', programId)
      .eq('perk_participant_id', perkParticipantId)
      .eq('pass_kind', options?.passKind || 'loyalty')
    
    if (options?.resourceType && options?.resourceId) {
      query = query
        .eq('resource_type', options.resourceType)
        .eq('resource_id', options.resourceId)
    } else {
      query = query
        .is('resource_type', null)
        .is('resource_id', null)
    }

    const { data, error } = await query.single()

    if (!error && data) {
      return { ok: true, url: data.url }
    }

    // Link doesn't exist, create it
    return await upsertInstallLink(programId, perkParticipantId, options)

  } catch (error) {
    console.error('Failed to get install link:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to get install link'
    }
  }
}

/**
 * Lookup participant by email in the given program
 */
export async function lookupParticipantByEmail(programId: string, email: string): Promise<ParticipantLookupResult> {
  try {
    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')

    const { data, error } = await supabase
      .from('participants')
      .select('perk_participant_id, email, status, unused_points')
      .eq('program_id', programId)
      .ilike('email', email)
      .single()

    if (error || !data) {
      return { ok: false, error: 'Participant not found in this program' }
    }

    return {
      ok: true,
      perkParticipantId: data.perk_participant_id,
      email: data.email,
      status: data.status,
      unused_points: data.unused_points || 0
    }

  } catch (error) {
    console.error('Failed to lookup participant:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to lookup participant'
    }
  }
}