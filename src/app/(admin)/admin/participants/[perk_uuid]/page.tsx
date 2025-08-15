import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface OldParticipantPageProps {
  params: Promise<{
    perk_uuid: string
  }>
}

export default async function OldParticipantPageRedirect({ params }: OldParticipantPageProps) {
  const { perk_uuid } = await params;
  
  // Try to find the participant by searching for a composite key reference
  // Since perk_uuid is being deprecated, show a helpful message
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h1 className="text-xl font-semibold text-yellow-800 mb-2">
          Participant Page Moved
        </h1>
        <p className="text-yellow-700 mb-4">
          The participant page structure has changed. Individual participants are now accessed through their program:
        </p>
        <p className="text-sm text-yellow-600 font-mono mb-4">
          /admin/programs/[program-id]/participants/[participant-id]
        </p>
        <p className="text-yellow-700">
          Please navigate to the specific program to view participant details.
        </p>
        <div className="mt-4">
          <a 
            href="/admin/programs" 
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Go to Programs
          </a>
        </div>
      </div>
    </div>
  )
}