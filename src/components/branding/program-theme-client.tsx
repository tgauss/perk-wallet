'use client';

import { ReactNode, createContext, useContext } from 'react';
import { ProgramBranding } from '@/lib/branding';

interface ProgramThemeContextValue {
  branding: ProgramBranding;
  colors: ProgramBranding['colors'];
  fonts: ProgramBranding['fonts'];
  borders: ProgramBranding['borders'];
  assets: ProgramBranding['assets'];
  headerContent: ProgramBranding['header_content'];
}

const ProgramThemeContext = createContext<ProgramThemeContextValue | null>(null);

interface ProgramThemeClientProps {
  branding: ProgramBranding;
  children: ReactNode;
}

export function ProgramThemeClient({ branding, children }: ProgramThemeClientProps) {
  const contextValue: ProgramThemeContextValue = {
    branding,
    colors: branding.colors,
    fonts: branding.fonts,
    borders: branding.borders,
    assets: branding.assets,
    headerContent: branding.header_content,
  };
  
  return (
    <ProgramThemeContext.Provider value={contextValue}>
      {children}
    </ProgramThemeContext.Provider>
  );
}

// Custom hook to access program theme tokens
export function useProgramTokens() {
  const context = useContext(ProgramThemeContext);
  
  if (!context) {
    throw new Error('useProgramTokens must be used within a ProgramThemeProvider');
  }
  
  return context;
}

// Helper hooks for specific theme aspects
export function useProgramColors() {
  return useProgramTokens().colors;
}

export function useProgramFonts() {
  return useProgramTokens().fonts;
}

export function useProgramBorders() {
  return useProgramTokens().borders;
}

export function useProgramAssets() {
  return useProgramTokens().assets;
}

export function useProgramHeaderContent() {
  return useProgramTokens().headerContent;
}