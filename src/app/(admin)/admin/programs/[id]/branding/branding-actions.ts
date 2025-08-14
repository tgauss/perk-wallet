'use server';

import { revalidatePath } from 'next/cache';
import { ProgramBranding, saveProgramBranding, uploadBrandingAsset, BrandingAssets } from '@/lib/branding';

export async function saveBrandingAction(
  programId: string,
  branding: ProgramBranding,
  applyToNewTemplates: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Save branding data
    const result = await saveProgramBranding(programId, branding);
    
    if (!result.success) {
      return result;
    }
    
    // Update program settings for the apply_to_new_templates flag
    if (applyToNewTemplates !== undefined) {
      const { supabase } = await import('@/lib/supabase');
      
      const { error: settingsError } = await supabase
        .from('programs')
        .update({
          settings: {
            branding_apply_to_new_templates: applyToNewTemplates,
          },
        })
        .eq('id', programId);
        
      if (settingsError) {
        console.warn('Failed to update template settings:', settingsError);
        // Don't fail the whole operation for this
      }
    }
    
    // Revalidate the page to show updated data
    revalidatePath(`/admin/programs/${programId}/branding`);
    revalidatePath(`/admin/programs/${programId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save branding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save branding',
    };
  }
}

export async function uploadAssetAction(
  programId: string,
  file: File,
  assetType: keyof BrandingAssets
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 10MB',
      };
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Only image files are allowed',
      };
    }
    
    // Generate filename with asset type prefix
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${assetType}-${timestamp}.${extension}`;
    
    // Upload to Supabase Storage
    const result = await uploadBrandingAsset(programId, file, filename);
    
    if (!result.success) {
      return result;
    }
    
    // Update the program's branding_assets JSON
    const { supabase } = await import('@/lib/supabase');
    
    // First, get current branding_assets
    const { data: currentData, error: fetchError } = await supabase
      .from('programs')
      .select('branding_assets')
      .eq('id', programId)
      .single();
      
    if (fetchError) {
      return {
        success: false,
        error: 'Failed to fetch current assets',
      };
    }
    
    // Update the specific asset
    const updatedAssets = {
      ...(currentData.branding_assets || {}),
      [assetType]: result.url,
    };
    
    const { error: updateError } = await supabase
      .from('programs')
      .update({ branding_assets: updatedAssets })
      .eq('id', programId);
      
    if (updateError) {
      return {
        success: false,
        error: 'Failed to update asset reference',
      };
    }
    
    // Revalidate the page
    revalidatePath(`/admin/programs/${programId}/branding`);
    
    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    console.error('Failed to upload asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload asset',
    };
  }
}

export async function seedProgramTheme(
  programId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Check if program exists
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('id, branding_colors, branding_fonts, branding_borders, branding_assets')
      .eq('id', programId)
      .single();
      
    if (fetchError || !program) {
      return {
        success: false,
        error: 'Program not found',
      };
    }
    
    // Prepare default values for missing branding data
    const updates: any = {};
    
    if (!program.branding_colors) {
      updates.branding_colors = {
        brand_color: '#3B82F6',
        brand_secondary_color: '#10B981',
        text_primary: '#0F172A',
        text_secondary: '#64748B',
        text_muted: '#94A3B8',
        background_primary: '#FFFFFF',
        background_secondary: '#F8FAFC',
        background_muted: '#F1F5F9',
        grad_from: '#3B82F6',
        grad_to: '#10B981',
      };
    }
    
    if (!program.branding_fonts) {
      updates.branding_fonts = {
        header_font: {
          family: 'Inter',
          weights: ['600', '700'],
        },
        body_font: {
          family: 'Open Sans',
          weights: ['400', '600'],
        },
      };
    }
    
    if (!program.branding_borders) {
      updates.branding_borders = {
        button_radius: 'md',
        input_radius: 'md',
        tile_radius: 'lg',
        card_radius: 'lg',
      };
    }
    
    if (!program.branding_assets) {
      updates.branding_assets = {};
    }
    
    // Only update if there are missing fields
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', programId);
        
      if (updateError) {
        return {
          success: false,
          error: 'Failed to seed default branding',
        };
      }
    }
    
    // Create storage folder if it doesn't exist
    try {
      const { supabase: storageSupabase } = await import('@/lib/supabase');
      
      // Upload a placeholder file to create the folder structure
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      const placeholderFile = new File([placeholderContent], '.gitkeep', { type: 'text/plain' });
      
      await storageSupabase.storage
        .from('brand-assets')
        .upload(`programs/${programId}/branding/.gitkeep`, placeholderFile, {
          upsert: true,
        });
    } catch (storageError) {
      // Storage folder creation is not critical, just log it
      console.warn('Failed to create storage folder:', storageError);
    }
    
    // Revalidate the page
    revalidatePath(`/admin/programs/${programId}/branding`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to seed program theme:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed theme',
    };
  }
}