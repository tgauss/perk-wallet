'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, X, CreditCard } from 'lucide-react'
import { getAdminPasses } from '@/lib/admin-service'
import type { Database } from '@/lib/supabase'

type Pass = Database['public']['Tables']['passes']['Row']

export default function PassesFilter() {
  const [passes, setPasses] = useState<Pass[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPasses()
  }, [statusFilter])

  const loadPasses = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminPasses(statusFilter === 'all' ? undefined : statusFilter)
      setPasses(data)
    } catch (error) {
      console.error('Error loading passes:', error)
      setPasses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceUpdate = (passId: string) => {
    console.log('Force update pass:', passId)
  }

  const handleExpirePass = (passId: string) => {
    console.log('Expire pass:', passId)
  }

  const getStatusBadge = (pass: Pass) => {
    // Derive status from available data
    if (pass.apple_serial_number || pass.google_object_id) {
      return <Badge variant="default">Active</Badge>
    } else {
      return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <>
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
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `Passes (${passes.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passes.length === 0 && !isLoading ? (
            <div className="text-center py-8 space-y-4">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No passes found</h3>
                <p className="text-sm text-muted-foreground">
                  No wallet passes have been issued yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant UUID</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Apple Serial</TableHead>
                    <TableHead>Google Object ID</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passes.map((pass) => (
                    <TableRow key={pass.id}>
                      <TableCell className="font-mono text-sm">
                        {pass.perk_uuid}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pass.pass_kind}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pass.apple_serial_number || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pass.google_object_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">v{pass.version}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(pass)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(pass.last_updated_at).toLocaleString()}
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
    </>
  )
}