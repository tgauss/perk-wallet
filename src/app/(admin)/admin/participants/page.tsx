'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Mail, RotateCcw, Send } from 'lucide-react'

const mockParticipants = [
  {
    id: '1',
    perk_uuid: 'uuid-123-abc',
    email: 'john@example.com',
    points: 1250,
    unused_points: 50,
    status: 'active',
    tier: 'gold',
    profile_attributes: { name: 'John Doe', city: 'San Francisco' },
    last_sync_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    perk_uuid: 'uuid-456-def',
    email: 'jane@example.com',
    points: 850,
    unused_points: 25,
    status: 'active',
    tier: 'silver',
    profile_attributes: { name: 'Jane Smith', city: 'New York' },
    last_sync_at: '2024-01-14T15:45:00Z'
  }
]

export default function ParticipantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [participants] = useState(mockParticipants)
  
  const filteredParticipants = participants.filter(p => 
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.perk_uuid.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleReissuePass = (participantId: string) => {
    console.log('Reissue pass for participant:', participantId)
  }

  const handleResendInstallLink = (participantId: string) => {
    console.log('Resend install link for participant:', participantId)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <p className="text-muted-foreground">
          Search and manage loyalty program participants
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Participants</CardTitle>
          <CardDescription>
            Search by email or perk UUID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results ({filteredParticipants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {participant.profile_attributes.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participant.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          UUID: {participant.perk_uuid}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{participant.points}</div>
                        <div className="text-sm text-muted-foreground">
                          {participant.unused_points} unused
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                        {participant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{participant.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(participant.last_sync_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReissuePass(participant.id)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reissue
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInstallLink(participant.id)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Resend
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}