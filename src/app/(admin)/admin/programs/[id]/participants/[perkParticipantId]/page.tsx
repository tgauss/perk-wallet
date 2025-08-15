import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fromDatabaseRow } from '@/lib/perk/normalize'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface PageProps {
  params: Promise<{ id: string; perkParticipantId: string }>
}

export default async function ProgramParticipantPage({ params }: PageProps) {
  const { id: programId, perkParticipantId } = await params

  // Fetch participant using composite key
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('program_id', programId)
    .eq('perk_participant_id', parseInt(perkParticipantId))
    .maybeSingle()

  if (error) {
    console.error('Error fetching participant:', error)
    redirect('/admin?error=participant-fetch-failed')
  }

  if (!participant) {
    redirect('/admin?error=participant-not-found')
  }

  // Normalize to snapshot
  const snapshot = fromDatabaseRow(participant)

  // Fetch program for context
  const { data: program } = await supabase
    .from('programs')
    .select('name, perk_program_id')
    .eq('id', programId)
    .single()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Participant {perkParticipantId}</h1>
          <p className="text-muted-foreground">
            Program: {program?.name} (ID: {program?.perk_program_id})
          </p>
        </div>
        <Badge variant={snapshot.status === 'active' ? 'default' : 'secondary'}>
          {snapshot.status || 'Unknown'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="font-mono">{snapshot.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p>
                {snapshot.fname || snapshot.lname 
                  ? `${snapshot.fname || ''} ${snapshot.lname || ''}`.trim()
                  : 'Not provided'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Points & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Points & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Available Points</label>
              <p className="text-2xl font-bold">{snapshot.unused_points?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Lifetime Points</label>
              <p className="text-lg">{snapshot.points?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tier</label>
              <p>{snapshot.tier || 'No tier assigned'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Attributes */}
        {snapshot.profile && Object.keys(snapshot.profile).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(snapshot.profile).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="font-mono text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {snapshot.tag_list && snapshot.tag_list.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {snapshot.tag_list.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Composite Key: {programId} / {perkParticipantId}</p>
        <p>Note: Internal UUIDs are not exposed for security</p>
      </div>
    </div>
  )
}