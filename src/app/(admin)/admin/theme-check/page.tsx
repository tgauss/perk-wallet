export const dynamic = 'force-dynamic'

import { ThemeDoctorClient } from './theme-doctor-client';

export default function ThemeCheckPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Theme Doctor</h1>
        <p className="text-muted-foreground">
          Diagnostic tool to verify CSS variables, Google Fonts, and component rendering
        </p>
      </div>
      
      <ThemeDoctorClient />
    </div>
  );
}