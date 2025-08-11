'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, X } from 'lucide-react'

const mockPasses = [
  {
    id: '1',
    perk_uuid: 'uuid-123-abc',
    pass_kind: 'loyalty',
    apple_serial: 'APL-12345',
    google_object_id: 'GOOG-67890',
    last_synced_at: '2024-01-15T10:30:00Z',
    last_error: null,
    status: 'active'
  },
  {
    id: '2',
    perk_uuid: 'uuid-456-def',
    pass_kind: 'loyalty',
    apple_serial: 'APL-54321',
    google_object_id: 'GOOG-09876',
    last_synced_at: '2024-01-14T15:45:00Z',
    last_error: 'Failed to update pass content',
    status: 'error'
  }
]

export default function PassesPage() {
  const [passes] = useState(mockPasses)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const filteredPasses = passes.filter(pass => 
    statusFilter === 'all' || pass.status === statusFilter
  )

  const handleForceUpdate = (passId: string) => {
    console.log('Force update pass:', passId)
  }

  const handleExpirePass = (passId: string) => {
    console.log('Expire pass:', passId)
  }

  const getStatusBadge = (status: string, error: string | null) => {
    if (error) {
      return <Badge variant="destructive">Error</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Passes</h1>
        <p className="text-muted-foreground">
          Manage wallet passes and their sync status
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Passes</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Passes ({filteredPasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant UUID</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Apple Serial</TableHead>
                  <TableHead>Google Object ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasses.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-mono text-sm">
                      {pass.perk_uuid}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pass.pass_kind}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {pass.apple_serial || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {pass.google_object_id || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(pass.status, pass.last_error)}
                        {pass.last_error && (
                          <div className="text-xs text-destructive">
                            {pass.last_error}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(pass.last_synced_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForceUpdate(pass.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExpirePass(pass.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Expire
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