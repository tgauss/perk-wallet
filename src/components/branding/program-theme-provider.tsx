import { ReactNode } from 'react';
import { defaultBranding, brandingToCSSVariables, generateGoogleFontsUrl, ProgramBranding } from '@/lib/branding';
import { ProgramThemeClient } from './program-theme-client';

interface ProgramThemeProviderProps {
  programId: string;
  children: ReactNode;
}

export async function ProgramThemeProvider({ programId, children }: ProgramThemeProviderProps) {
  let branding = defaultBranding;
  
  // Only load branding during runtime, not during build
  if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { loadProgramBranding } = await import('@/lib/branding');
      branding = await loadProgramBranding(programId);
    } catch (error) {
      console.warn('Failed to load program branding, using defaults:', error);
      branding = defaultBranding;
    }
  }
  
  // Generate CSS variables
  const cssVariables = brandingToCSSVariables(branding);
  
  // Generate Google Fonts URL
  const googleFontsUrl = generateGoogleFontsUrl(branding.fonts);
  
  return (
    <>
      {/* Inject Google Fonts if needed */}
      {googleFontsUrl && (
        <link
          rel="stylesheet"
          href={googleFontsUrl}
          crossOrigin="anonymous"
        />
      )}
      
      {/* Apply CSS variables to a wrapper element */}
      <div
        className="program-theme-wrapper"
        style={cssVariables}
        data-program-id={programId}
      >
        <ProgramThemeClient branding={branding}>
          {children}
        </ProgramThemeClient>
      </div>
    </>
  );
}