'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface DraftData {
  id: string
  program_id: string
  pass_kind: 'loyalty' | 'rewards'
  layout: any
  assets: Record<string, string>
  version: number
  is_published: boolean
}

interface PublishWorkflowProps {
  draft: DraftData
  expanded?: boolean
  onPublish?: () => void
}

interface ChangesSummary {
  fieldsChanged: number
  assetsChanged: number
  hasBreakingChanges: boolean
  details: string[]
}

export function PublishWorkflow({ draft, expanded = false, onPublish }: PublishWorkflowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')
  const [updateExistingPasses, setUpdateExistingPasses] = useState(true)

  // Calculate changes summary (mock data for now)
  const changesSummary: ChangesSummary = {
    fieldsChanged: 3,
    assetsChanged: 1,
    hasBreakingChanges: false,
    details: [
      'Header title updated',
      'Primary field value modified',
      'New secondary field added',
      'Logo asset updated'
    ]
  }

  const nextVersion = draft.version + 1

  const handlePublish = async () => {
    setIsPublishing(true)
    
    try {
      // TODO: Implement actual publish API
      console.log('Publishing draft:', {
        draftId: draft.id,
        version: nextVersion,
        message: publishMessage,
        updateExistingPasses
      })

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Template published as v${nextVersion}`)
      setIsOpen(false)
      onPublish?.()
      
    } catch (error) {
      console.error('Publish failed:', error)
      toast.error('Failed to publish template')
    } finally {
      setIsPublishing(false)
    }
  }

  const PublishContent = () => (
    <div className="space-y-6">
      {/* Version Info */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h4 className="font-medium">Publishing Version</h4>
          <p className="text-sm text-muted-foreground">
            {draft.pass_kind} template for {draft.program_id}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          v{nextVersion}
        </Badge>
      </div>

      {/* Changes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Changes Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{changesSummary.fieldsChanged}</div>
              <div className="text-sm text-blue-700">Fields Changed</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{changesSummary.assetsChanged}</div>
              <div className="text-sm text-green-700">Assets Changed</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h5 className="font-medium text-sm">Change Details:</h5>
            <ul className="space-y-1">
              {changesSummary.details.map((detail, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {changesSummary.hasBreakingChanges && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Breaking Changes Detected</p>
                <p className="text-sm text-yellow-700">
                  These changes may affect existing wallet passes
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Publish Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Update existing passes on publish</Label>
              <p className="text-sm text-muted-foreground">
                Send updates to wallet passes already in users' devices
              </p>
            </div>
            <Switch
              checked={updateExistingPasses}
              onCheckedChange={setUpdateExistingPasses}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="publish-message">
              Release Message (Optional)
            </Label>
            <Textarea
              id="publish-message"
              placeholder="Describe what changed in this version..."
              value={publishMessage}
              onChange={(e) => setPublishMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This message will be stored with the publish record for future reference
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!expanded && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publish v{nextVersion}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )

  if (expanded) {
    return (
      <div className="space-y-4">
        <PublishContent />
        <div className="flex justify-end">
          <Button onClick={handlePublish} disabled={isPublishing} size="lg">
            {isPublishing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publish v{nextVersion}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Template Draft</DialogTitle>
          <DialogDescription>
            Review your changes and publish this template as version {nextVersion}
          </DialogDescription>
        </DialogHeader>
        
        <PublishContent />
      </DialogContent>
    </Dialog>
  )
}