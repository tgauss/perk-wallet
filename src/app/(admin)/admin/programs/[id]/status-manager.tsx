'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, Settings, Loader2 } from 'lucide-react'
import { updateProgramStatus } from '@/lib/admin-actions'
import { getStatusTransitionEffects, type ProgramStatus, type ProgramStatusChange } from '@/lib/program-utils'
import type { Database } from '@/lib/supabase'

type Program = Database['public']['Tables']['programs']['Row']

interface StatusManagerProps {
  program: Program
}

export default function StatusManager({ program }: StatusManagerProps) {
  const currentStatus = ((program.settings as any)?.status || 'draft') as ProgramStatus
  const [selectedStatus, setSelectedStatus] = useState<ProgramStatus>(currentStatus)
  const [isChanging, setIsChanging] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effects = selectedStatus !== currentStatus 
    ? getStatusTransitionEffects(currentStatus, selectedStatus)
    : []

  const handleStatusChange = async () => {
    setIsChanging(true)
    setError(null)

    try {
      await updateProgramStatus(program.id, selectedStatus)
      setShowConfirmDialog(false)
      // Refresh the page to show updated status
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsChanging(false)
    }
  }

  const getStatusColor = (status: ProgramStatus) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'draft': return 'text-gray-600 bg-gray-50'
      case 'inactive': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusDescription = (status: ProgramStatus) => {
    switch (status) {
      case 'active': return 'Program is live and accepting participants'
      case 'draft': return 'Program is hidden from participants, safe for configuration'
      case 'inactive': return 'Program is paused, existing participants retain their data'
      default: return 'Unknown status'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Program Status</span>
        </CardTitle>
        <CardDescription>
          Manage program visibility and operational status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="space-y-1">
            <p className="text-sm font-medium">Current Status</p>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={
                  currentStatus === 'active' ? 'default' : 
                  currentStatus === 'draft' ? 'secondary' : 
                  'outline'
                }
              >
                {currentStatus}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getStatusDescription(currentStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Change Interface */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Change Status To</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Draft - Hidden from participants</span>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active - Live and operational</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Inactive - Paused</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show effects if status will change */}
          {effects.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Changing from {currentStatus} to {selectedStatus} will:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {effects.map((effect, index) => (
                      <li key={index} className="text-sm">{effect}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Change Button */}
          {selectedStatus !== currentStatus && (
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  Update Status to {selectedStatus}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Status Change</DialogTitle>
                  <DialogDescription>
                    You are about to change the program status from <strong>{currentStatus}</strong> to <strong>{selectedStatus}</strong>.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">This will cause the following effects:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {effects.map((effect, index) => (
                            <li key={index} className="text-sm">{effect}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={isChanging}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleStatusChange} 
                      disabled={isChanging}
                      className="flex-1"
                    >
                      {isChanging ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        `Confirm Change`
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}