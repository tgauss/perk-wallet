'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Copy, ExternalLink } from 'lucide-react'

const mockWebhookEvents = [
  {
    id: '1',
    event_type: 'points_earned',
    event_id: 'evt_123abc',
    participant_email: 'john@example.com',
    participant_id: 12345,
    processed_at: '2024-01-15T10:30:00Z',
    event_data: {
      participant_id: 12345,
      points_earned: 100,
      transaction_id: 'txn_456',
      reason: 'Purchase reward'
    },
    headers: {
      'X-Perk-Signature': 'sha256=abc123...',
      'Content-Type': 'application/json',
      'User-Agent': 'Perk-Webhooks/1.0'
    }
  },
  {
    id: '2',
    event_type: 'tier_changed',
    event_id: 'evt_789def',
    participant_email: 'jane@example.com',
    participant_id: 67890,
    processed_at: '2024-01-14T15:45:00Z',
    event_data: {
      participant_id: 67890,
      old_tier: 'silver',
      new_tier: 'gold',
      effective_date: '2024-01-14T15:45:00Z'
    },
    headers: {
      'X-Perk-Signature': 'sha256=def456...',
      'Content-Type': 'application/json',
      'User-Agent': 'Perk-Webhooks/1.0'
    }
  }
]

export default function WebhooksPage() {
  const [events] = useState(mockWebhookEvents)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const generateCurlCommand = (event: any) => {
    const headers = Object.entries(event.headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' ')
    
    return `curl -X POST https://your-domain.com/api/webhooks/perk/your-program-id \\
  ${headers} \\
  -d '${JSON.stringify(event.event_data, null, 2)}'`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          View webhook events received from Perk API
        </p>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Last 200 webhook events received from Perk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Participant</TableHead>
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
                        <div className="font-medium">{event.participant_email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {event.participant_id}
                        </div>
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
                                <TabsTrigger value="headers">Headers</TabsTrigger>
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
                              
                              <TabsContent value="headers" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Request Headers</h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyToClipboard(JSON.stringify(selectedEvent.headers, null, 2))}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                  <pre className="text-xs bg-muted p-4 rounded font-mono overflow-auto">
                                    {JSON.stringify(selectedEvent.headers, null, 2)}
                                  </pre>
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
        </CardContent>
      </Card>
    </div>
  )
}