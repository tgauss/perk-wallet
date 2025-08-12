'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, RotateCcw, Send, Users } from 'lucide-react'
import { searchParticipants } from '@/lib/admin-service'
import type { Database } from '@/lib/supabase'

type Participant = Database['public']['Tables']['participants']['Row']

export default function ParticipantsSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      const results = await searchParticipants(searchQuery.trim())
      setParticipants(results)
      setHasSearched(true)
    } catch (error) {
      console.error('Error searching participants:', error)
      setParticipants([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReissuePass = (participantId: string) => {
    console.log('Reissue pass for participant:', participantId)
  }

  const handleResendInstallLink = (participantId: string) => {
    console.log('Resend install link for participant:', participantId)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <>
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
                onKeyDown={handleKeyPress}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No participants found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try searching with a different email or UUID.
                  </p>
                </div>
              </div>
            ) : (
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
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {participant.profile_attributes?.name || 'N/A'}
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                            {participant.status || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.tier || 'none'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {participant.last_sync_at 
                              ? new Date(participant.last_sync_at).toLocaleString()
                              : 'Never'
                            }
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
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}