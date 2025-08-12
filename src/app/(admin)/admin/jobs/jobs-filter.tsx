'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RefreshCw, Eye, AlertTriangle, Briefcase } from 'lucide-react'
import { getAdminJobs, retryJob } from '@/lib/admin-service'
import type { Database } from '@/lib/supabase'

type Job = Database['public']['Tables']['jobs']['Row']

export default function JobsFilter() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
  }, [statusFilter])

  const loadJobs = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminJobs(statusFilter === 'all' ? undefined : statusFilter)
      setJobs(data)
    } catch (error) {
      console.error('Error loading jobs:', error)
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingId(jobId)
      await retryJob(jobId)
      // Refresh the jobs list
      await loadJobs()
    } catch (error) {
      console.error('Error retrying job:', error)
    } finally {
      setRetryingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDuration = (job: Job) => {
    if (job.completed_at) {
      const start = new Date(job.scheduled_at).getTime()
      const end = new Date(job.completed_at).getTime()
      return `${Math.round((end - start) / 1000)}s`
    }
    if (job.started_at) {
      return 'Running...'
    }
    return '-'
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
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadJobs} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `Recent Jobs (${jobs.length})`}
          </CardTitle>
          <CardDescription>Last 200 background jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 && !isLoading ? (
            <div className="text-center py-8 space-y-4">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No jobs found</h3>
                <p className="text-sm text-muted-foreground">
                  No background jobs have been executed yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {job.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(job.status)}
                          {job.error && (
                            <div className="flex items-center space-x-1 text-xs text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Error</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {job.attempts}/{job.max_attempts}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(job.scheduled_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getDuration(job)}
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
                            <DialogContent className="max-w-2xl">
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
                                    <div>
                                      <label className="text-sm font-medium">Attempts</label>
                                      <p className="text-sm text-muted-foreground">{selectedJob.attempts}/{selectedJob.max_attempts}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Scheduled</label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(selectedJob.scheduled_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedJob.error && (
                                    <div>
                                      <label className="text-sm font-medium">Error</label>
                                      <p className="text-sm text-destructive font-mono bg-muted p-2 rounded">
                                        {selectedJob.error}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-sm font-medium">Payload</label>
                                    <pre className="text-xs bg-muted p-2 rounded font-mono overflow-auto max-h-40">
                                      {JSON.stringify(selectedJob.payload, null, 2)}
                                    </pre>
                                  </div>
                                  {selectedJob.result && (
                                    <div>
                                      <label className="text-sm font-medium">Result</label>
                                      <pre className="text-xs bg-muted p-2 rounded font-mono overflow-auto max-h-40">
                                        {JSON.stringify(selectedJob.result, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {job.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                              disabled={retryingId === job.id}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              {retryingId === job.id ? 'Retrying...' : 'Retry'}
                            </Button>
                          )}
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