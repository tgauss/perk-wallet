import { z } from 'zod';

// Zod schemas for branding data structures
export const BrandingColorsSchema = z.object({
  brand_color: z.string().default('#3B82F6'),
  brand_secondary_color: z.string().default('#10B981'),
  text_primary: z.string().default('#0F172A'),
  text_secondary: z.string().default('#64748B'),
  text_muted: z.string().default('#94A3B8'),
  background_primary: z.string().default('#FFFFFF'),
  background_secondary: z.string().default('#F8FAFC'),
  background_muted: z.string().default('#F1F5F9'),
  grad_from: z.string().default('#3B82F6'),
  grad_to: z.string().default('#10B981'),
});

// Handle both legacy string format and new object format for fonts
const FontSchema = z.union([
  z.string(),
  z.object({
    family: z.string(),
    weights: z.array(z.string()),
  }),
]);

export const BrandingFontsSchema = z.object({
  header_font: FontSchema.transform((val) => {
    if (typeof val === 'string') {
      return {
        family: val || 'Inter',
        weights: ['600', '700'],
      };
    }
    return {
      family: val.family || 'Inter',
      weights: val.weights || ['600', '700'],
    };
  }),
  body_font: FontSchema.transform((val) => {
    if (typeof val === 'string') {
      return {
        family: val || 'Open Sans',
        weights: ['400', '600'],
      };
    }
    return {
      family: val.family || 'Open Sans',
      weights: val.weights || ['400', '600'],
    };
  }),
});

export const BrandingBordersSchema = z.object({
  button_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('md'),
  input_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('md'),
  tile_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('lg'),
  card_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('lg'),
});

export const BrandingAssetsSchema = z.object({
  logo: z.string().optional(),
  footer_logo: z.string().optional(),
  overlay_image: z.string().optional(),
  header_background_image: z.string().optional(),
  badge_background_image: z.string().optional(),
  favicon: z.string().optional(),
});

export const BrandingHeaderContentSchema = z.object({
  header_text: z.string().default('Welcome to Our Program'),
  header_description: z.string().default('Experience exclusive rewards and benefits'),
});

// Combined branding schema
export const ProgramBrandingSchema = z.object({
  colors: BrandingColorsSchema,
  fonts: BrandingFontsSchema,
  borders: BrandingBordersSchema,
  assets: BrandingAssetsSchema,
  header_content: BrandingHeaderContentSchema,
});

// TypeScript types derived from schemas
export type BrandingColors = z.infer<typeof BrandingColorsSchema>;
export type BrandingFonts = {
  header_font: {
    family: string;
    weights: string[];
  };
  body_font: {
    family: string;
    weights: string[];
  };
};
export type BrandingBorders = z.infer<typeof BrandingBordersSchema>;
export type BrandingAssets = z.infer<typeof BrandingAssetsSchema>;
export type BrandingHeaderContent = z.infer<typeof BrandingHeaderContentSchema>;
export type ProgramBranding = {
  colors: BrandingColors;
  fonts: BrandingFonts;
  borders: BrandingBorders;
  assets: BrandingAssets;
  header_content: BrandingHeaderContent;
};

// Radius mapping for CSS
export const radiusMap = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
};

// Default branding configuration
export const defaultBranding: ProgramBranding = {
  colors: BrandingColorsSchema.parse({}),
  fonts: BrandingFontsSchema.parse({}),
  borders: BrandingBordersSchema.parse({}),
  assets: BrandingAssetsSchema.parse({}),
  header_content: BrandingHeaderContentSchema.parse({}),
};

// Load program branding from database
export async function loadProgramBranding(programId: string): Promise<ProgramBranding> {
  // During build time, return defaults to avoid database calls
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return defaultBranding;
  }
  
  try {
    // Dynamic import to avoid loading during build
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('programs')
      .select('branding_colors, branding_assets, branding_borders, branding_fonts')
      .eq('id', programId)
      .single();
      
    if (error || !data) {
      console.warn(`Failed to load branding for program ${programId}, using defaults:`, error);
      return defaultBranding;
    }
  
  // Parse and validate each branding section with defaults
  const colors = data.branding_colors 
    ? BrandingColorsSchema.parse({ ...defaultBranding.colors, ...data.branding_colors })
    : defaultBranding.colors;
    
  // Handle fonts - they might be strings or objects in the database
  let fonts: BrandingFonts = defaultBranding.fonts;
  if (data.branding_fonts) {
    try {
      // Try to parse with the schema (handles both string and object formats)
      const parsedFonts = BrandingFontsSchema.parse(data.branding_fonts);
      fonts = parsedFonts as BrandingFonts;
    } catch (e) {
      console.warn('Failed to parse branding fonts, using defaults:', e);
      fonts = defaultBranding.fonts;
    }
  }
    
  const borders = data.branding_borders
    ? BrandingBordersSchema.parse({ ...defaultBranding.borders, ...data.branding_borders })
    : defaultBranding.borders;
    
  const assets = data.branding_assets
    ? BrandingAssetsSchema.parse({ ...defaultBranding.assets, ...data.branding_assets })
    : defaultBranding.assets;
  
    return {
      colors,
      fonts,
      borders,
      assets,
      header_content: defaultBranding.header_content, // Will add to DB later
    };
  } catch (e) {
    console.warn('Error loading branding, using defaults:', e);
    return defaultBranding;
  }
}

// Save program branding to database
export async function saveProgramBranding(
  programId: string, 
  branding: Partial<ProgramBranding>
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Dynamic import to avoid loading during build
    const { supabase } = await import('@/lib/supabase');
    const updateData: any = {};
    
    if (branding.colors) {
      updateData.branding_colors = BrandingColorsSchema.parse(branding.colors);
    }
    if (branding.fonts) {
      // Save fonts in the format expected by the database and form
      updateData.branding_fonts = {
        header_font: branding.fonts.header_font,
        body_font: branding.fonts.body_font,
      };
    }
    if (branding.borders) {
      updateData.branding_borders = BrandingBordersSchema.parse(branding.borders);
    }
    if (branding.assets) {
      updateData.branding_assets = BrandingAssetsSchema.parse(branding.assets);
    }
    
    const { error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', programId);
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

// Generate Google Fonts URL
export function generateGoogleFontsUrl(fonts: BrandingFonts): string {
  const fontParams: string[] = [];
  
  // Add header font
  if (fonts.header_font.family !== 'system') {
    const weights = fonts.header_font.weights.join(',');
    fontParams.push(`family=${encodeURIComponent(fonts.header_font.family)}:wght@${weights}`);
  }
  
  // Add body font (avoid duplicates)
  if (fonts.body_font.family !== 'system' && fonts.body_font.family !== fonts.header_font.family) {
    const weights = fonts.body_font.weights.join(',');
    fontParams.push(`family=${encodeURIComponent(fonts.body_font.family)}:wght@${weights}`);
  }
  
  if (fontParams.length === 0) {
    return '';
  }
  
  return `https://fonts.googleapis.com/css2?${fontParams.join('&')}&display=swap`;
}

// Convert branding to CSS variables
export function brandingToCSSVariables(branding: ProgramBranding): Record<string, string> {
  const { colors, borders } = branding;
  
  return {
    '--primary': colors.brand_color,
    '--primary-foreground': '#FFFFFF',
    '--secondary': colors.brand_secondary_color,
    '--secondary-foreground': '#FFFFFF',
    '--background': colors.background_primary,
    '--foreground': colors.text_primary,
    '--card': colors.background_secondary,
    '--card-foreground': colors.text_primary,
    '--muted': colors.background_muted,
    '--muted-foreground': colors.text_muted,
    '--border': colors.background_muted,
    '--input': colors.background_secondary,
    '--ring': colors.brand_color,
    '--radius': radiusMap[borders.card_radius],
    '--header-font': `"${branding.fonts.header_font.family}", sans-serif`,
    '--body-font': `"${branding.fonts.body_font.family}", sans-serif`,
  };
}

// Get Supabase storage path for branding assets
export function getBrandingAssetPath(programId: string, filename: string): string {
  return `programs/${programId}/branding/${filename}`;
}

// Upload file to Supabase Storage
export async function uploadBrandingAsset(
  programId: string,
  file: File,
  filename?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  
  try {
    // Dynamic import to avoid loading during build
    const { supabase } = await import('@/lib/supabase');
    const finalFilename = filename || `${Date.now()}-${file.name}`;
    const path = getBrandingAssetPath(programId, finalFilename);
    
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(path);
      
    return { success: true, url: publicUrl };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Upload failed' 
    };
  }
}