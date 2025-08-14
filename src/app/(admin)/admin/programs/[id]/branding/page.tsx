export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation';
import { loadProgramBranding } from '@/lib/branding';
import { BrandingForm } from './branding-form';
import { BrandingPreview } from './branding-preview';

interface BrandingPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { id: programId } = await params;
  
  if (!programId) {
    notFound();
  }
  
  // Load current branding data
  const branding = await loadProgramBranding(programId);
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Branding</h1>
          <p className="text-muted-foreground">
            Customize the visual appearance and branding for this program
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left side: Live Preview */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
            <BrandingPreview branding={branding} />
          </div>
        </div>
        
        {/* Right side: Configuration Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
            <BrandingForm programId={programId} branding={branding} />
          </div>
        </div>
      </div>
    </div>
  );
}