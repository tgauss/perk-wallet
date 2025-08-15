import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link as LinkIcon, Mail, Hash } from 'lucide-react'
import { getProgramById } from '@/lib/programs'
import { InstallLinksClient } from './install-links-client'

interface InstallLinksPageProps {
  params: Promise<{ id: string }>
}

export default async function InstallLinksPage({ params }: InstallLinksPageProps) {
  const { id: programId } = await params
  
  // Get program info
  const program = await getProgramById(programId)
  
  if (!program) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Program Not Found</h1>
              <p className="text-gray-600 mt-2">The requested program could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Install Links</h1>
        <p className="text-muted-foreground">
          Generate universal install links for participants in {program.name}
        </p>
      </div>

      {/* Program Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LinkIcon className="w-5 h-5" />
            <span>Program Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Program Name</div>
              <div className="text-lg font-semibold">{program.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Program ID (UUID)</div>
              <div className="text-sm font-mono">{program.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Perk Program ID (Numeric)</div>
              <div className="text-lg font-semibold">{program.perk_program_id}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Install Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hash className="w-5 h-5" />
            <span>Generate Install Link</span>
          </CardTitle>
          <CardDescription>
            Create a universal install link that works on both iOS and Android devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <InstallLinksClient programId={programId} perkProgramId={program.perk_program_id} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">How it works</p>
              <p className="text-sm text-muted-foreground">
                Install links allow participants to add wallet passes to their device. 
                The link automatically detects the device type and provides the appropriate pass format.
                Links are cached in the database for quick retrieval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}