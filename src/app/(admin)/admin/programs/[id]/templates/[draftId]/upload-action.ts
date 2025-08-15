'use server'

import { revalidatePath } from 'next/cache'

// Asset types for template uploads
export type AssetKind = 'logo' | 'icon' | 'strip' | 'background' | 'googleCover'

// Upload result types
export type UploadAssetResult = 
  | { ok: true; url: string; path: string }
  | { ok: false; error: string }

interface UploadAssetParams {
  programId: string
  draftId: string
  file: File
  kind: AssetKind
}

export async function uploadAsset(params: UploadAssetParams): Promise<UploadAssetResult> {
  const { programId, draftId, file, kind } = params

  try {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        ok: false,
        error: 'Only PNG, JPG, JPEG, and WebP image files are allowed'
      }
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        ok: false,
        error: 'File size must be less than 5MB'
      }
    }

    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('@/lib/supabase')

    // Ensure bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return { ok: false, error: `Failed to check buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'pass-assets')
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('pass-assets', {
        public: true,
        allowedMimeTypes: allowedTypes,
        fileSizeLimit: maxSize,
      })
      
      if (createError) {
        return { ok: false, error: `Failed to create bucket: ${createError.message}` }
      }
    }

    // Generate unique filename
    const uuid = crypto.randomUUID()
    const fileExtension = file.name.split('.').pop()
    const originalFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
    const path = `programs/${programId}/drafts/${draftId}/${uuid}/${originalFileName}`

    // Upload file to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('pass-assets')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pass-assets')
      .getPublicUrl(path)

    // Revalidate the editor page
    revalidatePath(`/admin/programs/${programId}/templates/${draftId}`)

    return {
      ok: true,
      url: publicUrl,
      path: path
    }

  } catch (error) {
    console.error('Asset upload error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}