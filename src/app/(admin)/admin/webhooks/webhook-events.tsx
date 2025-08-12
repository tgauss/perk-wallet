'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Copy, RefreshCw, Webhook } from 'lucide-react'
import { getAdminWebhookEvents } from '@/lib/admin-service'
import type { Database } from '@/lib/supabase'

type WebhookEvent = Database['public']['Tables']['webhook_events']['Row']

export default function WebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminWebhookEvents()
      setEvents(data)
    } catch (error) {
      console.error('Error loading webhook events:', error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateCurlCommand = (event: WebhookEvent) => {
    // Generate a basic curl command for testing
    return `curl -X POST https://your-domain.com/api/webhooks/perk/${event.program_id} \\
  -H "Content-Type: application/json" \\
  -H "X-Perk-Event-Type: ${event.event_type}" \\
  -H "X-Perk-Event-ID: ${event.event_id}" \\
  -d '${JSON.stringify(event.event_data, null, 2)}'`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isLoading ? 'Loading...' : `Recent Webhook Events (${events.length})`}
            </CardTitle>
            <CardDescription>
              Last 200 webhook events received from Perk
            </CardDescription>
          </div>
          <Button onClick={loadEvents} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 && !isLoading ? (
          <div className="text-center py-8 space-y-4">
            <Webhook className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No webhook events found</h3>
              <p className="text-sm text-muted-foreground">
                No webhook events have been received from Perk yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Processed At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.event_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        {event.participant_email && (
                          <div className="font-medium">{event.participant_email}</div>
                        )}
                        {event.participant_id && (
                          <div className="text-sm text-muted-foreground">
                            ID: {event.participant_id}
                          </div>
                        )}
                        {event.participant_uuid && (
                          <div className="text-xs font-mono text-muted-foreground">
                            UUID: {event.participant_uuid}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {event.perk_program_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(event.processed_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Webhook Event Details</DialogTitle>
                            <DialogDescription>
                              {selectedEvent?.event_type} - {selectedEvent?.event_id}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedEvent && (
                            <Tabs defaultValue="payload" className="mt-4">
                              <TabsList>
                                <TabsTrigger value="payload">Event Payload</TabsTrigger>
                                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                                <TabsTrigger value="curl">cURL Replay</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="payload" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Event Data</h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyToClipboard(JSON.stringify(selectedEvent.event_data, null, 2))}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                  <pre className="text-xs bg-muted p-4 rounded font-mono overflow-auto max-h-96">
                                    {JSON.stringify(selectedEvent.event_data, null, 2)}
                                  </pre>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="metadata" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Event Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedEvent.event_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Event ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">{selectedEvent.event_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Program ID</label>
                                    <p className="text-sm text-muted-foreground">{selectedEvent.perk_program_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Processed At</label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedEvent.processed_at).toLocaleString()}
                                    </p>
                                  </div>
                                  {selectedEvent.participant_email && (
                                    <div>
                                      <label className="text-sm font-medium">Participant Email</label>
                                      <p className="text-sm text-muted-foreground">{selectedEvent.participant_email}</p>
                                    </div>
                                  )}
                                  {selectedEvent.participant_id && (
                                    <div>
                                      <label className="text-sm font-medium">Participant ID</label>
                                      <p className="text-sm text-muted-foreground">{selectedEvent.participant_id}</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="curl" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">cURL Command</h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyToClipboard(generateCurlCommand(selectedEvent))}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                  <pre className="text-xs bg-muted p-4 rounded font-mono overflow-auto whitespace-pre-wrap">
                                    {generateCurlCommand(selectedEvent)}
                                  </pre>
                                  <p className="text-xs text-muted-foreground">
                                    Use this command to replay the webhook event for testing purposes
                                  </p>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}