'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RefreshCw, Eye, AlertTriangle } from 'lucide-react'

const mockJobs = [
  {
    id: '1',
    type: 'pass_update',
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z',
    completed_at: '2024-01-15T10:31:00Z',
    last_error: null,
    payload: { participant_id: 'uuid-123', action: 'update_points' }
  },
  {
    id: '2',
    type: 'webhook_process',
    status: 'failed',
    created_at: '2024-01-15T09:45:00Z',
    completed_at: null,
    last_error: 'Connection timeout to Perk API',
    payload: { event_type: 'points_earned', participant_id: 'uuid-456' }
  },
  {
    id: '3',
    type: 'pass_issue',
    status: 'running',
    created_at: '2024-01-15T11:00:00Z',
    completed_at: null,
    last_error: null,
    payload: { participant_id: 'uuid-789', template_id: 'template-1' }
  }
]

export default function JobsPage() {
  const [jobs] = useState(mockJobs)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  
  const filteredJobs = jobs.filter(job => 
    statusFilter === 'all' || job.status === statusFilter
  )

  const handleRetryJob = (jobId: string) => {
    console.log('Retry job:', jobId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary">Running</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Monitor background jobs and task execution
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
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>Last 200 background jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-sm">
                      {job.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(job.status)}
                        {job.last_error && (
                          <div className="flex items-center space-x-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Error</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.completed_at 
                          ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)}s`
                          : job.status === 'running' ? 'Running...' : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedJob(job)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Job Details</DialogTitle>
                              <DialogDescription>
                                Job ID: {selectedJob?.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedJob && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedJob.type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                                  </div>
                                </div>
                                {selectedJob.last_error && (
                                  <div>
                                    <label className="text-sm font-medium">Error</label>
                                    <p className="text-sm text-destructive font-mono">{selectedJob.last_error}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium">Payload</label>
                                  <pre className="text-xs bg-muted p-2 rounded font-mono overflow-auto">
                                    {JSON.stringify(selectedJob.payload, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {job.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        )}
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