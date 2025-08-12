'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from './supabase'
import { requireEmulatedIdentity } from './auth-emulator'
import { canEditProgram, canManageParticipants, canManagePasses, canManageJobs, canViewAllPrograms } from './perm'
import { validatePerkApiKey } from './perk-api'
import { type ProgramStatus } from './program-utils'
import type { Database } from './supabase'

type Program = Database['public']['Tables']['programs']['Row']

// Re-export types from program-utils for backward compatibility
export { type ProgramStatus, type ProgramStatusChange } from './program-utils'

// Example server action for updating program branding
export async function updateProgramBranding(programId: string, branding: any) {
  // Check permissions
  const identity = await requireEmulatedIdentity()
  const canEdit = await canEditProgram(programId)
  
  if (!canEdit) {
    throw new Error('Permission denied: cannot edit program')
  }

  // In real implementation, this would use Supabase service client
  console.log('Updating program branding:', { programId, branding, user: identity.email })
  
  // Simulate database update
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Revalidate the page
  revalidatePath(`/admin/programs/${programId}`)
  
  return { success: true }
}

// Example server action for reissuing a pass
export async function reissuePass(participantId: string, programId?: string) {
  const identity = await requireEmulatedIdentity()
  const canReissue = await canManageParticipants(programId)
  
  if (!canReissue) {
    throw new Error('Permission denied: cannot reissue passes')
  }

  // In real implementation, this would:
  // 1. Get participant data from Supabase
  // 2. Call Perk API to reissue pass
  // 3. Update our database
  console.log('Reissuing pass for participant:', { participantId, programId, user: identity.email })
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  revalidatePath('/admin/participants')
  
  return { success: true }
}

// Example server action for copying API key (server-side only)
export async function copyApiKeyToClipboard(programId: string) {
  const identity = await requireEmulatedIdentity()
  const canEdit = await canEditProgram(programId)
  
  if (!canEdit) {
    throw new Error('Permission denied: cannot access API keys')
  }

  // In real implementation, this would:
  // 1. Get the actual API key from Supabase (never send to client)
  // 2. Return success status for toast notification
  console.log('API key accessed by:', { programId, user: identity.email })
  
  // Simulate key retrieval without actually returning it
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return { 
    success: true, 
    message: 'API key copied to clipboard' 
  }
}

// Example server action for retrying failed jobs
export async function retryFailedJob(jobId: string, programId?: string) {
  const identity = await requireEmulatedIdentity()
  const canManage = await canManageJobs(programId)
  
  if (!canManage) {
    throw new Error('Permission denied: cannot manage jobs')
  }

  // In real implementation, this would re-queue the job
  console.log('Retrying job:', { jobId, programId, user: identity.email })
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  revalidatePath('/admin/jobs')
  
  return { success: true }
}

// Example server action for bumping template version
export async function bumpTemplateVersion(templateId: string, programId?: string) {
  const identity = await requireEmulatedIdentity()
  const canManage = await canEditProgram(programId) // Templates are program-scoped
  
  if (!canManage) {
    throw new Error('Permission denied: cannot manage templates')
  }

  // In real implementation, this would:
  // 1. Get current template version
  // 2. Create new version with incremented number
  // 3. Set new version as active
  console.log('Bumping template version:', { templateId, programId, user: identity.email })
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  revalidatePath('/admin/templates')
  
  return { 
    success: true, 
    newVersion: 4 // Mock new version number
  }
}

// Re-export utility function for backward compatibility
export { getStatusTransitionEffects } from './program-utils'

// Create a new program (super admin only)
export async function createProgram(data: {
  perk_program_id: string
  name: string
  description: string
  api_key: string
  status?: ProgramStatus
  apple_pass_type_id?: string
  google_wallet_class_id?: string
  brand_color: string
  brand_text_color: string
  secondary_color: string
  secondary_text_color: string
  body_background_color: string
  body_content_color: string
  header_background_color: string
  header_font_color: string
  hero_font_color: string
  challenge_tile_background_color: string
  reward_tile_background_color: string
  footer_background_color: string
  footer_font_color: string
  favicon_url?: string
  logo_url?: string
  footer_logo_url?: string
  overlay_image_url?: string
  hero_title?: string
  hero_description?: string
  hero_background_image_url?: string
  badge_background_image_url?: string
  header_font: string
  body_font: string
  button_border_radius: string
  input_border_radius: string
  tiles_border_radius: string
  cards_border_radius: string
}): Promise<Program> {
  const identity = await requireEmulatedIdentity()
  const isSuperAdmin = await canViewAllPrograms()
  
  if (!isSuperAdmin) {
    throw new Error('Permission denied: only super admins can create programs')
  }

  // Validate Perk API key
  const validationResult = await validatePerkApiKey(data.api_key, data.perk_program_id)
  if (!validationResult.valid) {
    throw new Error(`Perk API validation failed: ${validationResult.error}`)
  }

  // Create the program ID using the Perk program ID
  const programId = data.perk_program_id
  const status = data.status || 'draft'

  // Structure the data for insertion
  const programData = {
    id: programId,
    perk_program_id: parseInt(data.perk_program_id),
    name: data.name,
    description: data.description || null,
    api_key: data.api_key,
    // Removed webhook_secret - no longer needed
    apple_pass_type_id: data.apple_pass_type_id || null,
    google_wallet_class_id: data.google_wallet_class_id || null,
    settings: { 
      status,
      created_by: identity.email,
      api_validated_at: new Date().toISOString()
    },
    branding_fonts: {
      header_font: data.header_font,
      body_font: data.body_font
    },
    branding_colors: {
      brand_color: data.brand_color,
      brand_text_color: data.brand_text_color,
      secondary_color: data.secondary_color,
      secondary_text_color: data.secondary_text_color,
      body_background_color: data.body_background_color,
      body_content_color: data.body_content_color,
      header_background_color: data.header_background_color,
      header_font_color: data.header_font_color,
      hero_font_color: data.hero_font_color,
      challenge_tile_background_color: data.challenge_tile_background_color,
      reward_tile_background_color: data.reward_tile_background_color,
      footer_background_color: data.footer_background_color,
      footer_font_color: data.footer_font_color
    },
    branding_assets: {
      favicon_url: data.favicon_url || undefined,
      logo_url: data.logo_url || undefined,
      footer_logo_url: data.footer_logo_url || undefined,
      overlay_image_url: data.overlay_image_url || undefined,
      hero_title: data.hero_title || undefined,
      hero_description: data.hero_description || undefined,
      hero_background_image_url: data.hero_background_image_url || undefined,
      badge_background_image_url: data.badge_background_image_url || undefined
    },
    branding_borders: {
      button_border_radius: data.button_border_radius,
      input_border_radius: data.input_border_radius,
      tiles_border_radius: data.tiles_border_radius,
      cards_border_radius: data.cards_border_radius
    }
  }

  const { data: program, error } = await supabase
    .from('programs')
    .insert(programData)
    .select()
    .single()

  if (error) {
    console.error('Error creating program:', error)
    if (error.code === '23505') {
      throw new Error('A program with this ID already exists')
    }
    throw new Error(`Failed to create program: ${error.message}`)
  }

  revalidatePath('/admin/programs')
  return program
}

// Update program status with validation
export async function updateProgramStatus(
  programId: string, 
  newStatus: ProgramStatus
): Promise<ProgramStatusChange> {
  const canEdit = await canEditProgram(programId)
  
  if (!canEdit) {
    throw new Error('Permission denied: cannot edit this program')
  }

  // Get current program
  const { data: program, error: fetchError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (fetchError || !program) {
    throw new Error('Program not found')
  }

  const currentStatus = (program.settings as any)?.status || 'draft'
  const effects = getStatusTransitionEffects(currentStatus, newStatus)

  // Update program status
  const updatedSettings = {
    ...program.settings,
    status: newStatus,
    status_updated_at: new Date().toISOString(),
    status_updated_by: (await requireEmulatedIdentity()).email
  }

  const { error } = await supabase
    .from('programs')
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('id', programId)

  if (error) {
    throw new Error(`Failed to update program status: ${error.message}`)
  }

  revalidatePath(`/admin/programs/${programId}`)
  revalidatePath('/admin/programs')

  return {
    from: currentStatus,
    to: newStatus,
    effects
  }
}

// Update an existing program
export async function updateProgram(
  programId: string,
  data: Partial<{
    name: string
    description: string
    api_key: string
    apple_pass_type_id: string
    google_wallet_class_id: string
    status: ProgramStatus
    branding_fonts: Program['branding_fonts']
    branding_colors: Program['branding_colors']
    branding_assets: Program['branding_assets']
    branding_borders: Program['branding_borders']
  }>
): Promise<void> {
  const canEdit = await canEditProgram(programId)
  
  if (!canEdit) {
    throw new Error('Permission denied: cannot edit this program')
  }

  // Validate API key if it's being updated
  if (data.api_key) {
    const validationResult = await validatePerkApiKey(data.api_key, programId)
    if (!validationResult.valid) {
      throw new Error(`Perk API validation failed: ${validationResult.error}`)
    }
  }

  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString()
  }

  // Handle status change separately if provided
  if (data.status) {
    const statusChange = await updateProgramStatus(programId, data.status)
    // Remove status from updateData since it's handled separately
    delete updateData.status
  }

  const { error } = await supabase
    .from('programs')
    .update(updateData)
    .eq('id', programId)

  if (error) {
    throw new Error(`Failed to update program: ${error.message}`)
  }
  
  revalidatePath(`/admin/programs/${programId}`)
  revalidatePath('/admin/programs')
}