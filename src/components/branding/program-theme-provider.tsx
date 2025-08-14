import { ReactNode } from 'react';
import { loadProgramBranding, brandingToCSSVariables, generateGoogleFontsUrl, ProgramBranding } from '@/lib/branding';
import { ProgramThemeClient } from './program-theme-client';

interface ProgramThemeProviderProps {
  programId: string;
  children: ReactNode;
}

export async function ProgramThemeProvider({ programId, children }: ProgramThemeProviderProps) {
  // Load branding from database
  const branding = await loadProgramBranding(programId);
  
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