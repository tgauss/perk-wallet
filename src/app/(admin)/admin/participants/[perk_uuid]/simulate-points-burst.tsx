'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, Play, ExternalLink, TestTube } from 'lucide-react'

interface SimulatePointsBurstProps {
  programId: string
  perkUuid: string
  participantEmail: string
  currentPoints: number
  pointsDisplay: 'points' | 'unused_points'
}

export default function SimulatePointsBurst({
  programId,
  perkUuid,
  participantEmail,
  currentPoints,
  pointsDisplay
}: SimulatePointsBurstProps) {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [formData, setFormData] = useState({
    totalEvents: 5,
    deltaPerEvent: 5,
    durationSec: 90,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRunning(true)

    try {
      const response = await fetch('/api/dev/simulate/points-burst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programId,
          perk_uuid: perkUuid,
          ...formData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Simulation Started',
          description: `${result.simulation.events_scheduled} events scheduled over ${formData.durationSec} seconds`,
        })
      } else {
        toast({
          title: 'Simulation Failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Simulation error:', error)
      toast({
        title: 'Simulation Failed',
        description: 'Network error or server unavailable',
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const totalPointsChange = formData.totalEvents * formData.deltaPerEvent
  const intervalMs = formData.durationSec * 1000 / (formData.totalEvents - 1)

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <TestTube className="w-5 h-5" />
          <span>Simulate Points Burst</span>
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Development Only
          </Badge>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Test notification merging and throttling by simulating rapid points updates.
          This generates synthetic events without affecting actual Perk balances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-orange-300 bg-orange-100">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Testing Tool:</strong> This simulates notification events without modifying real participant data.
            Use it to verify that notification merging and throttling work correctly.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalEvents">Total Events</Label>
              <Input
                id="totalEvents"
                type="number"
                min={1}
                max={20}
                value={formData.totalEvents}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  totalEvents: parseInt(e.target.value) || 1 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Number of point updates to simulate (1-20)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deltaPerEvent">Points Per Event</Label>
              <Input
                id="deltaPerEvent"
                type="number"
                min={1}
                max={100}
                value={formData.deltaPerEvent}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  deltaPerEvent: parseInt(e.target.value) || 1 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Points to add per event (+1 to +100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationSec">Duration (seconds)</Label>
              <Input
                id="durationSec"
                type="number"
                min={10}
                max={300}
                value={formData.durationSec}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  durationSec: parseInt(e.target.value) || 10 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Time to spread events over (10-300s)
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-sm">Simulation Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Participant:</p>
                <p className="font-medium">{participantEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current {pointsDisplay === 'points' ? 'Total' : 'Unused'} Points:</p>
                <p className="font-medium">{currentPoints}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Points Change:</p>
                <p className="font-medium text-green-600">+{totalPointsChange}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Event Interval:</p>
                <p className="font-medium">{Math.round(intervalMs / 1000 * 10) / 10}s</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>• Events will be queued with merge window (120s) and throttle (300s)</p>
              <p>• Multiple rapid events should merge into a single notification</p>
              <p>• Check the Jobs page to see notification buffer collapse</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isRunning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRunning ? (
                'Running Simulation...'
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Burst
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/jobs">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Jobs
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}