export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { canViewProgram } from '@/lib/perm'
import { supabase } from '@/lib/supabase'
import { fromDatabaseRow } from '@/lib/perk/normalize'
import { ArrowLeft, User, Mail, Trophy, Clock } from 'lucide-react'
import SimulatePointsBurst from './simulate-points-burst'

interface ParticipantPageProps {
  params: Promise<{
    perk_uuid: string
  }>
}

export default async function ParticipantPage({ params }: ParticipantPageProps) {
  const { perk_uuid } = await params;
  const identity = await requireEmulatedIdentity()
  
  // Get participant data
  const { data: participant } = await supabase
    .from('participants')
    .select(`
      *,
      programs!participants_program_id_fkey (*)
    `)
    .eq('perk_uuid', perk_uuid)
    .single()

  if (!participant) {
    notFound()
  }

  const canView = await canViewProgram(participant.program_id)
  
  if (!canView) {
    notFound()
  }

  // Create normalized snapshot for display
  const snapshot = fromDatabaseRow(participant)
  const program = (participant as any).programs

  // Get points display preference
  const pointsDisplay = program?.settings?.points_display || 'unused_points'
  const currentPoints = pointsDisplay === 'points' ? snapshot.points : snapshot.unused_points

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/participants">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Participants
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <User className="w-8 h-8" />
            <span>{snapshot.fname && snapshot.lname ? `${snapshot.fname} ${snapshot.lname}` : snapshot.email}</span>
          </h1>
          <p className="text-muted-foreground">
            UUID: {snapshot.perk_uuid} • Program: {program?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={snapshot.status === 'active' ? 'default' : 'secondary'}>
            {snapshot.status || 'Unknown'}
          </Badge>
          {snapshot.tier && (
            <Badge variant="outline">
              {snapshot.tier}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Participant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Participant Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{snapshot.email || 'Not provided'}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perk Participant ID</p>
                <p className="text-lg font-mono">{snapshot.perk_participant_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">First Name</p>
                <p className="text-lg">{snapshot.fname || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                <p className="text-lg">{snapshot.lname || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={snapshot.status === 'active' ? 'default' : 'secondary'}>
                  {snapshot.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tier</p>
                <p className="text-lg">{snapshot.tier || 'Not assigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Points & Rewards</span>
            </CardTitle>
            <CardDescription>
              Current points display mode: {pointsDisplay === 'points' ? 'Total Points' : 'Unused Points'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-600">Current Points</p>
                <p className="text-3xl font-bold text-green-700">{currentPoints}</p>
                <p className="text-xs text-green-600">
                  {pointsDisplay === 'points' ? 'Total earned' : 'Available to spend'}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-600">Total Points</p>
                <p className="text-2xl font-bold text-blue-700">{snapshot.points}</p>
                <p className="text-xs text-blue-600">All-time earned</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-600">Unused Points</p>
                <p className="text-2xl font-bold text-purple-700">{snapshot.unused_points}</p>
                <p className="text-xs text-purple-600">Available to redeem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {snapshot.tag_list && snapshot.tag_list.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {snapshot.tag_list.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Attributes */}
        {Object.keys(snapshot.profile).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(snapshot.profile).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-muted-foreground">{key}</p>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Webhook Event</p>
                <p className="text-sm">{participant.last_webhook_event_type || 'None'}</p>
                {participant.last_webhook_event_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(participant.last_webhook_event_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Webhook Event Count</p>
                <p className="text-sm">{participant.webhook_event_count || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(participant.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{new Date(participant.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulate Points Burst - Development Only */}
        {process.env.NODE_ENV === 'development' && 
         (identity.role === 'super_admin' || identity.role === 'program_admin') && (
          <SimulatePointsBurst 
            programId={participant.program_id}
            perkUuid={snapshot.perk_uuid}
            participantEmail={snapshot.email || 'Unknown'}
            currentPoints={currentPoints}
            pointsDisplay={pointsDisplay}
          />
        )}
      </div>
    </div>
  )
}