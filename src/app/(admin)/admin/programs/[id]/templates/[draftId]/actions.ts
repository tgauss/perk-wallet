'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Validation schemas
const DraftPatchSchema = z.object({
  layout: z.record(z.any()).optional(),
  assets: z.record(z.any()).optional(),
})

const DraftUpdateResult = z.object({
  ok: z.literal(true),
}).or(z.object({
  ok: z.literal(false),
  error: z.string(),
}))

const PublishResult = z.object({
  ok: z.literal(true),
  version: z.number(),
}).or(z.object({
  ok: z.literal(false),
  error: z.string(),
}))

export type DraftUpdateResult = z.infer<typeof DraftUpdateResult>
export type PublishResult = z.infer<typeof PublishResult>

export async function updateDraft(
  draftId: string,
  patch: { layout?: unknown; assets?: unknown }
): Promise<DraftUpdateResult> {
  try {
    // Validate input
    const validatedPatch = DraftPatchSchema.parse(patch)
    
    if (!validatedPatch.layout && !validatedPatch.assets) {
      return { ok: false, error: 'No changes provided' }
    }

    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (validatedPatch.layout !== undefined) {
      updateData.layout = validatedPatch.layout
    }
    
    if (validatedPatch.assets !== undefined) {
      updateData.assets = validatedPatch.assets
    }

    const { error } = await supabase
      .from('template_drafts')
      .update(updateData)
      .eq('id', draftId)

    if (error) {
      return { ok: false, error: error.message }
    }

    // Revalidate the editor page
    revalidatePath(`/admin/programs/*/templates/${draftId}`)
    
    return { ok: true }
  } catch (error) {
    console.error('Failed to update draft:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to update draft'
    }
  }
}

export async function publishDraft(
  programId: string,
  draftId: string
): Promise<PublishResult> {
  try {
    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')
    
    // Load the draft
    const { data: draft, error: draftError } = await supabase
      .from('template_drafts')
      .select('program_id, pass_kind, layout, assets')
      .eq('id', draftId)
      .eq('program_id', programId)
      .single()

    if (draftError || !draft) {
      return { ok: false, error: 'Draft not found or access denied' }
    }

    // Get latest version for this program and pass_kind
    const { data: latestTemplate } = await supabase
      .from('templates')
      .select('version')
      .eq('program_id', programId)
      .eq('pass_kind', draft.pass_kind)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    // If no program-specific templates exist, check for global ones
    let latestVersion = latestTemplate?.version || 0
    
    if (!latestTemplate) {
      const { data: globalTemplate } = await supabase
        .from('templates')
        .select('version')
        .is('program_id', null)
        .eq('pass_kind', draft.pass_kind)
        .order('version', { ascending: false })
        .limit(1)
        .single()
        
      latestVersion = globalTemplate?.version || 0
    }

    const nextVersion = latestVersion + 1

    // Insert new template
    const { data: newTemplate, error: templateError } = await supabase
      .from('templates')
      .insert({
        program_id: programId,
        pass_kind: draft.pass_kind,
        version: nextVersion,
        apple_template: draft.layout, // For now, use layout for both
        google_template: draft.layout,
        fields_mapping: draft.assets, // Store assets in fields_mapping for now
        is_active: true,
      })
      .select('id')
      .single()

    if (templateError) {
      return { ok: false, error: `Failed to create template: ${templateError.message}` }
    }

    // Optionally: Queue a bulk resync job (non-blocking)
    try {
      await supabase
        .from('jobs')
        .insert({
          type: 'bulk_resync_passes',
          status: 'pending',
          payload: {
            program_id: programId,
            pass_kind: draft.pass_kind,
            template_id: newTemplate.id,
          },
          max_attempts: 3,
          scheduled_at: new Date().toISOString(),
        })
    } catch (jobError) {
      // Job insertion failure is non-critical
      console.warn('Failed to queue resync job:', jobError)
    }

    // Revalidate related pages
    revalidatePath(`/admin/programs/${programId}/templates`)
    revalidatePath(`/admin/programs/${programId}/templates/${draftId}`)
    
    return { ok: true, version: nextVersion }
  } catch (error) {
    console.error('Failed to publish draft:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to publish draft'
    }
  }
}

// Utility function to create storage bucket if it doesn't exist
export async function ensurePassAssetsBucket(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Try to get bucket info to see if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return { ok: false, error: `Failed to check buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'pass-assets')
    
    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('pass-assets', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/json'],
        fileSizeLimit: 10485760, // 10MB
      })
      
      if (createError) {
        return { ok: false, error: `Failed to create bucket: ${createError.message}` }
      }
    }
    
    return { ok: true }
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}