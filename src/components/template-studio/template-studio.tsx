'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, Settings, Upload, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'

import { PreviewRenderer } from './preview/preview-renderer'
import { DeviceChrome } from './preview/device-chrome'
import { FieldMapping } from './fields/field-mapping'
import { AssetValidator } from './assets/asset-validator'
import { PublishWorkflow } from './publish/publish-workflow'
import { useAnalytics } from './hooks/use-analytics'

interface TemplateStudioProps {
  programId: string
  draftId: string
}

interface DraftData {
  id: string
  program_id: string
  pass_kind: 'loyalty' | 'rewards'
  layout: any
  assets: Record<string, string>
  version: number
  is_published: boolean
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
}

export function TemplateStudio({ programId, draftId }: TemplateStudioProps) {
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })
  const [activeTab, setActiveTab] = useState('fields')
  
  // Device preview state
  const [deviceType, setDeviceType] = useState<'apple' | 'google'>('apple')
  const [showDeviceChrome, setShowDeviceChrome] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [showGrid, setShowGrid] = useState(false)

  const analytics = useAnalytics()

  // Load draft data
  const loadDraft = useCallback(async () => {
    try {
      // TODO: Implement draft loading API
      console.log('Loading draft:', draftId)
      
      // Mock data for now
      const mockDraft: DraftData = {
        id: draftId,
        program_id: programId,
        pass_kind: 'loyalty',
        layout: {
          header: { title: '{program_name}', subtitle: 'Member Card' },
          primary: [{ label: 'Points', value: '{points}' }],
          secondary: [
            { label: 'Status', value: '{tier}' },
            { label: 'Member Since', value: '2024' }
          ]
        },
        assets: {},
        version: 1,
        is_published: false
      }
      
      setDraft(mockDraft)
      updatePreview(mockDraft.layout)
    } catch (error) {
      console.error('Failed to load draft:', error)
      toast.error('Failed to load template draft')
    }
  }, [draftId, programId])

  // Debounced preview update
  const debouncedUpdatePreview = useDebouncedCallback((layout: any) => {
    updatePreview(layout)
  }, 300)

  // Update preview with current layout
  const updatePreview = useCallback(async (layout: any) => {
    try {
      const response = await fetch('/api/admin/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          draft_id: draftId,
          layout
        })
      })

      if (!response.ok) {
        throw new Error('Preview request failed')
      }

      const result = await response.json()
      if (result.ok) {
        setPreviewData(result.resolved)
      }
    } catch (error) {
      console.error('Preview update failed:', error)
    }
  }, [programId, draftId])

  // Debounced autosave
  const debouncedSave = useDebouncedCallback(async (draftToSave: DraftData) => {
    setSaveState({ status: 'saving' })
    
    try {
      // TODO: Implement save API
      console.log('Saving draft:', draftToSave)
      
      // Mock save delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSaveState({ status: 'saved', lastSaved: new Date() })
      analytics.track('draft_saved', { 
        program_id: programId, 
        draft_id: draftId,
        pass_kind: draftToSave.pass_kind 
      })
      
      setTimeout(() => {
        setSaveState(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev)
      }, 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setSaveState({ status: 'error' })
      toast.error('Failed to save draft')
    }
  }, 1000)

  // Handle layout changes
  const handleLayoutChange = useCallback((newLayout: any) => {
    if (!draft) return

    const updatedDraft = { ...draft, layout: newLayout }
    setDraft(updatedDraft)
    debouncedUpdatePreview(newLayout)
    debouncedSave(updatedDraft)

    analytics.track('field_mapping_applied', {
      program_id: programId,
      draft_id: draftId
    })
  }, [draft, debouncedUpdatePreview, debouncedSave, analytics, programId, draftId])

  // Handle device toggle
  const handleDeviceToggle = useCallback((type: 'apple' | 'google') => {
    setDeviceType(type)
    analytics.track('device_toggle', { 
      program_id: programId, 
      device_type: type 
    })
  }, [analytics, programId])

  // Handle zoom change
  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom)
    analytics.track('preview_zoom_changed', { 
      program_id: programId, 
      zoom_level: zoom 
    })
  }, [analytics, programId])

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!draft) return
    await debouncedSave(draft)
  }, [draft, debouncedSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // TODO: Open merge tag palette
        console.log('Open merge tag palette')
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        // TODO: Open help
        console.log('Open help')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleManualSave])

  // Load initial data
  useEffect(() => {
    loadDraft()
  }, [loadDraft])

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Template Studio</h1>
              <Badge variant="outline">{draft.pass_kind}</Badge>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {saveState.status === 'saving' && (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                    <span>Saving...</span>
                  </>
                )}
                {saveState.status === 'saved' && (
                  <>
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>Saved</span>
                  </>
                )}
                {saveState.lastSaved && (
                  <span className="text-xs">
                    {saveState.lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleManualSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <PublishWorkflow 
                draft={draft}
                onPublish={() => {
                  analytics.track('draft_published', {
                    program_id: programId,
                    draft_id: draftId,
                    version: draft.version + 1
                  })
                }}
              />
            </div>
          </div>
        </div>

        {/* Editor Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
            <TabsTrigger value="fields" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Fields</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Assets</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="publish" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Publish</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 p-6">
            <TabsContent value="fields" className="h-full">
              <FieldMapping
                layout={draft.layout}
                onChange={handleLayoutChange}
                programId={programId}
              />
            </TabsContent>

            <TabsContent value="assets" className="h-full">
              <AssetValidator
                assets={draft.assets}
                layout={draft.layout}
                onChange={(assets) => {
                  const updatedDraft = { ...draft, assets }
                  setDraft(updatedDraft)
                  debouncedSave(updatedDraft)
                  analytics.track('asset_upload_validated', {
                    program_id: programId,
                    draft_id: draftId
                  })
                }}
              />
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <DeviceChrome
                deviceType={deviceType}
                onDeviceToggle={handleDeviceToggle}
                showChrome={showDeviceChrome}
                onChromeToggle={setShowDeviceChrome}
                zoomLevel={zoomLevel}
                onZoomChange={handleZoomChange}
                showSafeArea={showSafeArea}
                onSafeAreaToggle={setShowSafeArea}
                showGrid={showGrid}
                onGridToggle={setShowGrid}
              >
                <PreviewRenderer
                  deviceType={deviceType}
                  layout={previewData || draft.layout}
                  assets={draft.assets}
                  showSafeArea={showSafeArea}
                  showGrid={showGrid}
                  programId={programId}
                />
              </DeviceChrome>
            </TabsContent>

            <TabsContent value="publish" className="h-full">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Publishing Options</h3>
                <PublishWorkflow 
                  draft={draft}
                  expanded={true}
                  onPublish={() => {
                    analytics.track('draft_published', {
                      program_id: programId,
                      draft_id: draftId,
                      version: draft.version + 1
                    })
                  }}
                />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-96 border-l bg-muted/30 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Live Preview</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={deviceType === 'apple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceToggle('apple')}
              >
                Apple
              </Button>
              <Button
                variant={deviceType === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceToggle('google')}
              >
                Google
              </Button>
            </div>
          </div>

          <DeviceChrome
            deviceType={deviceType}
            onDeviceToggle={handleDeviceToggle}
            showChrome={showDeviceChrome}
            onChromeToggle={setShowDeviceChrome}
            zoomLevel={75} // Smaller for sidebar
            onZoomChange={() => {}} // No zoom control in sidebar
            showSafeArea={showSafeArea}
            onSafeAreaToggle={setShowSafeArea}
            showGrid={showGrid}
            onGridToggle={setShowGrid}
            compact={true}
          >
            <PreviewRenderer
              deviceType={deviceType}
              layout={previewData || draft.layout}
              assets={draft.assets}
              showSafeArea={showSafeArea}
              showGrid={showGrid}
              programId={programId}
              compact={true}
            />
          </DeviceChrome>
        </div>
      </div>
    </div>
  )
}