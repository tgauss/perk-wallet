'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Save, 
  Upload, 
  Eye, 
  Smartphone, 
  Palette,
  Settings,
  CheckCircle,
  AlertCircle,
  FileImage,
  MapPin,
  X,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import { updateDraft, publishDraft, ensurePassAssetsBucket } from './actions'
import type { DraftUpdateResult, PublishResult } from './actions'
import { uploadAsset, type AssetKind, type UploadAssetResult } from './upload-action'

// Types
interface TemplateDraft {
  id: string
  program_id: string
  pass_kind: 'loyalty' | 'rewards'
  based_on_template: string | null
  layout: Record<string, any>
  assets: Record<string, any>
  updated_at: string
}

interface EditorClientProps {
  draft: TemplateDraft
  programId: string
}

// Utility to safely format JSON
function formatJSON(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return JSON.stringify({})
  }
}

// Utility to safely parse JSON
function parseJSON(str: string): { success: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(str)
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
}

// Utility for relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function EditorClient({ draft, programId }: EditorClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('layout')
  const [layoutJson, setLayoutJson] = useState(formatJSON(draft.layout))
  const [assetsJson, setAssetsJson] = useState(formatJSON(draft.assets))
  const [lastSaved, setLastSaved] = useState(draft.updated_at)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'apple' | 'google'>('apple')
  const [uploadingAssets, setUploadingAssets] = useState<Set<AssetKind>>(new Set())
  const [currentAssets, setCurrentAssets] = useState<Record<string, any>>(draft.assets)

  const handleFormatJSON = (type: 'layout' | 'assets') => {
    if (type === 'layout') {
      const parsed = parseJSON(layoutJson)
      if (parsed.success) {
        setLayoutJson(formatJSON(parsed.data))
      }
    } else {
      const parsed = parseJSON(assetsJson)
      if (parsed.success) {
        setAssetsJson(formatJSON(parsed.data))
      }
    }
  }

  const handleSaveDraft = async () => {
    setSaveStatus('saving')
    setErrorMessage(null)

    const layoutParsed = parseJSON(layoutJson)
    const assetsParsed = parseJSON(assetsJson)

    if (!layoutParsed.success) {
      setSaveStatus('error')
      setErrorMessage(`Layout JSON error: ${layoutParsed.error}`)
      return
    }

    if (!assetsParsed.success) {
      setSaveStatus('error')
      setErrorMessage(`Assets JSON error: ${assetsParsed.error}`)
      return
    }

    try {
      const result: DraftUpdateResult = await updateDraft(draft.id, {
        layout: layoutParsed.data,
        assets: assetsParsed.data,
      })

      if (result.ok) {
        setSaveStatus('saved')
        setLastSaved(new Date().toISOString())
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setErrorMessage(result.error)
      }
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save')
    }
  }

  const handlePublishDraft = async () => {
    startTransition(async () => {
      try {
        const result: PublishResult = await publishDraft(programId, draft.id)
        
        if (result.ok) {
          // Redirect back to templates list with success message
          router.push(`/admin/programs/${programId}/templates?published=v${result.version}`)
        } else {
          setErrorMessage(result.error)
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to publish')
      }
    })
  }

  const handleAssetUpload = async (file: File, kind: AssetKind) => {
    setUploadingAssets(prev => new Set([...prev, kind]))
    setErrorMessage(null)

    try {
      const result: UploadAssetResult = await uploadAsset({
        programId,
        draftId: draft.id,
        file,
        kind
      })

      if (result.ok) {
        // Update local assets state
        const newAssets = {
          ...currentAssets,
          [kind]: result.url
        }
        setCurrentAssets(newAssets)
        setAssetsJson(formatJSON(newAssets))

        // Persist to database
        const updateResult = await updateDraft(draft.id, {
          assets: newAssets
        })

        if (!updateResult.ok) {
          setErrorMessage(`Upload succeeded but failed to save: ${updateResult.error}`)
        }
      } else {
        setErrorMessage(result.error)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploadingAssets(prev => {
        const newSet = new Set(prev)
        newSet.delete(kind)
        return newSet
      })
    }
  }

  const handleAssetRemove = async (kind: AssetKind) => {
    const newAssets = { ...currentAssets }
    delete newAssets[kind]
    
    setCurrentAssets(newAssets)
    setAssetsJson(formatJSON(newAssets))

    // Persist to database
    try {
      const result = await updateDraft(draft.id, {
        assets: newAssets
      })

      if (!result.ok) {
        setErrorMessage(`Failed to remove asset: ${result.error}`)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to remove asset')
    }
  }

  // Asset uploader component
  const AssetUploader = ({ kind, label, description }: { 
    kind: AssetKind; 
    label: string; 
    description: string 
  }) => {
    const isUploading = uploadingAssets.has(kind)
    const currentUrl = currentAssets[kind]

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        
        {currentUrl ? (
          <div className="space-y-2">
            <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <img 
                src={currentUrl} 
                alt={label}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById(`file-${kind}`)?.click()}
                disabled={isUploading}
              >
                Replace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAssetRemove(kind)}
                disabled={isUploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div 
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => document.getElementById(`file-${kind}`)?.click()}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById(`file-${kind}`)?.click()}
              disabled={isUploading}
              className="w-24"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}
        
        <input
          id={`file-${kind}`}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleAssetUpload(file, kind)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Editor Tabs */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Template Editor</span>
                  <Badge variant={draft.pass_kind === 'loyalty' ? 'default' : 'secondary'}>
                    {draft.pass_kind}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Last saved {formatRelativeTime(lastSaved)}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {saveStatus === 'saved' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {saveStatus === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>JSON Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure the template layout and structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="layout-json">Layout JSON</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFormatJSON('layout')}
                    >
                      Format JSON
                    </Button>
                  </div>
                  <Textarea
                    id="layout-json"
                    value={layoutJson}
                    onChange={(e) => setLayoutJson(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                    placeholder="Enter layout JSON..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="assets-json">Assets JSON</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFormatJSON('assets')}
                    >
                      Format JSON
                    </Button>
                  </div>
                  <Textarea
                    id="assets-json"
                    value={assetsJson}
                    onChange={(e) => setAssetsJson(e.target.value)}
                    className="font-mono text-sm min-h-[200px]"
                    placeholder="Enter assets JSON..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleSaveDraft}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fields & Mapping Tab */}
          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Field Mapping</span>
                </CardTitle>
                <CardDescription>
                  Configure how participant data maps to template fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Field mapping interface coming soon. Available mappings will include:
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div>
                        <div className="font-medium">Points Display</div>
                        <div className="text-sm text-muted-foreground">points → unused_points</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div>
                        <div className="font-medium">Participant Name</div>
                        <div className="text-sm text-muted-foreground">fname, lname → full_name</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div>
                        <div className="font-medium">Tier & Status</div>
                        <div className="text-sm text-muted-foreground">tier, status → dynamic badges</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div>
                        <div className="font-medium">Dynamic Links</div>
                        <div className="text-sm text-muted-foreground">QR codes, web passes</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4" />
                  <span>Asset Management</span>
                </CardTitle>
                <CardDescription>
                  Upload and manage template assets (PNG, JPG, JPEG, WebP - max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AssetUploader
                    kind="logo"
                    label="Logo"
                    description="Main brand logo displayed on pass"
                  />
                  
                  <AssetUploader
                    kind="icon"
                    label="Icon"
                    description="Small icon for notifications and lists"
                  />
                  
                  <AssetUploader
                    kind="strip"
                    label="Strip Image"
                    description="Apple Wallet strip background"
                  />
                  
                  <AssetUploader
                    kind="background"
                    label="Background"
                    description="Full background image for pass"
                  />
                  
                  <AssetUploader
                    kind="googleCover"
                    label="Google Cover"
                    description="Google Wallet cover image"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </CardTitle>
                    <CardDescription>
                      Preview how the template will look on devices
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={previewMode === 'apple' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('apple')}
                    >
                      Apple
                    </Button>
                    <Button
                      variant={previewMode === 'google' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('google')}
                    >
                      Google
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Device Frame */}
                    <div className="w-80 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-4 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-2xl p-4 flex flex-col">
                        <div className="flex items-center space-x-2 mb-4">
                          <Smartphone className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {previewMode === 'apple' ? 'Apple Wallet' : 'Google Wallet'}
                          </span>
                        </div>
                        
                        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col">
                          {/* Header with logo */}
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            {currentAssets.logo ? (
                              <img 
                                src={currentAssets.logo} 
                                alt="Logo" 
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium">Pass Title</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {draft.pass_kind} Pass
                              </div>
                            </div>
                          </div>
                          
                          {/* Background area */}
                          <div 
                            className="flex-1 mt-2 rounded border flex items-center justify-center text-center relative overflow-hidden"
                            style={{
                              backgroundImage: currentAssets.background 
                                ? `url(${currentAssets.background})` 
                                : currentAssets.strip 
                                  ? `url(${currentAssets.strip})` 
                                  : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {currentAssets.background || currentAssets.strip ? (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="text-white text-xs">Preview Content</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Palette className="w-6 h-6 text-muted-foreground mx-auto" />
                                <div className="text-xs text-muted-foreground">
                                  Upload assets to see preview
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Icon preview */}
                          {currentAssets.icon && (
                            <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                              <img 
                                src={currentAssets.icon} 
                                alt="Icon" 
                                className="w-4 h-4 object-contain"
                              />
                              <span>Notification icon</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Publish Template</span>
                </CardTitle>
                <CardDescription>
                  Publish this draft as a new template version
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Publishing will create a new template version that can be used to generate wallet passes. 
                    Existing passes can be resynced later to use the new template.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Impact:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Creates a new template version</li>
                    <li>• New passes will use this template</li>
                    <li>• Existing passes keep their current design</li>
                    <li>• Background resync job will be queued</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handlePublishDraft}
                          disabled={isPending}
                          className="w-full"
                        >
                          {isPending ? 'Publishing...' : 'Publish Draft as New Version'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This will create a new template version</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Right Column: Live Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              Real-time preview of your template changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-muted/50">
              <div className="text-center space-y-2">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto" />
                <div className="text-lg font-medium text-muted-foreground">
                  Preview Panel
                </div>
                <div className="text-sm text-muted-foreground max-w-sm">
                  Live preview integration coming soon. Will show real-time updates as you edit the template.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}