'use client'

import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
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
import { MERGE_TAGS, getMergeTagSuggestions, type MergeTag } from '@/lib/merge-tags'

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
  
  // Field mapping state
  const [fieldMappings, setFieldMappings] = useState({
    headerText: 'Welcome {name}!',
    primary1Label: 'Points Available',
    primary1Value: '{unused_points}',
    primary2Label: 'Member Status',
    primary2Value: '{tier}',
    pointsLabel: 'Total Points',
    pointsValue: '{points}'
  })
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout>()

  // Load initial preview data
  useEffect(() => {
    updatePreview()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Field mapping functions
  const updateFieldMapping = (field: string, value: string) => {
    setFieldMappings(prev => ({ ...prev, [field]: value }))
    debouncedPreviewUpdate()
  }

  const debouncedPreviewUpdate = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    previewTimeoutRef.current = setTimeout(() => {
      updatePreview()
    }, 400)
  }, [])

  const updatePreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    
    try {
      const response = await fetch('/api/admin/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          draft_id: draft.id
        })
      })
      
      const result = await response.json()
      
      if (result.ok) {
        setPreviewData(result.resolved)
      } else {
        setPreviewError(result.error)
      }
    } catch (error) {
      setPreviewError('Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const applyFieldMappingsToLayout = async () => {
    const currentLayout = parseJSON(layoutJson)
    if (!currentLayout.success) {
      setErrorMessage('Invalid layout JSON. Please fix before applying field mappings.')
      return
    }

    // Create a basic layout structure with field mappings
    const enhancedLayout = {
      ...currentLayout.data,
      fieldMappings,
      header: {
        ...currentLayout.data.header,
        text: fieldMappings.headerText
      },
      fields: [
        {
          label: fieldMappings.primary1Label,
          value: fieldMappings.primary1Value,
          type: 'primary'
        },
        {
          label: fieldMappings.primary2Label, 
          value: fieldMappings.primary2Value,
          type: 'primary'
        },
        {
          label: fieldMappings.pointsLabel,
          value: fieldMappings.pointsValue,
          type: 'auxiliary'
        }
      ]
    }

    setLayoutJson(formatJSON(enhancedLayout))
    
    // Save to database
    const result = await updateDraft(draft.id, {
      layout: enhancedLayout
    })

    if (result.ok) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setErrorMessage(result.error)
    }
  }

  // Merge tag autocomplete component
  const MergeTagInput = ({ 
    value, 
    onChange, 
    placeholder, 
    label 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder?: string;
    label?: string;
  }) => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestions, setSuggestions] = useState<MergeTag[]>([])
    const [cursorPosition, setCursorPosition] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const position = e.target.selectionStart || 0
      setCursorPosition(position)
      onChange(newValue)
      
      // Check if we should show suggestions (typing '{' or after '{')
      const beforeCursor = newValue.slice(0, position)
      const lastBraceIndex = beforeCursor.lastIndexOf('{')
      
      if (lastBraceIndex !== -1 && !beforeCursor.slice(lastBraceIndex).includes('}')) {
        const partial = beforeCursor.slice(lastBraceIndex + 1)
        const filteredSuggestions = getMergeTagSuggestions(partial)
        setSuggestions(filteredSuggestions)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }

    const insertTag = (tag: string) => {
      const beforeCursor = value.slice(0, cursorPosition)
      const afterCursor = value.slice(cursorPosition)
      const lastBraceIndex = beforeCursor.lastIndexOf('{')
      
      if (lastBraceIndex !== -1) {
        const newValue = value.slice(0, lastBraceIndex) + tag + afterCursor
        onChange(newValue)
        setShowSuggestions(false)
        
        // Focus input and set cursor after inserted tag
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = lastBraceIndex + tag.length
            inputRef.current.focus()
            inputRef.current.setSelectionRange(newPosition, newPosition)
          }
        }, 0)
      }
    }

    return (
      <div className="relative">
        {label && <Label className="text-sm font-medium">{label}</Label>}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="font-mono text-sm"
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => {
            // Re-check for suggestions on focus
            const position = inputRef.current?.selectionStart || 0
            const beforeCursor = value.slice(0, position)
            const lastBraceIndex = beforeCursor.lastIndexOf('{')
            
            if (lastBraceIndex !== -1 && !beforeCursor.slice(lastBraceIndex).includes('}')) {
              const partial = beforeCursor.slice(lastBraceIndex + 1)
              const filteredSuggestions = getMergeTagSuggestions(partial)
              setSuggestions(filteredSuggestions)
              setShowSuggestions(true)
            }
          }}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => insertTag(suggestion.tag)}
              >
                <div className="font-mono text-sm text-blue-600">{suggestion.tag}</div>
                <div className="text-xs text-gray-500">{suggestion.label}</div>
                <div className="text-xs text-gray-400">{suggestion.example}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
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
                  Configure common template fields with merge tags. Type {`{`} to see available tags.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Field Mappers */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <MergeTagInput
                        label="Header Text"
                        value={fieldMappings.headerText}
                        onChange={(value) => updateFieldMapping('headerText', value)}
                        placeholder="Welcome {name}!"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <MergeTagInput
                        label="Primary Field 1 - Label"
                        value={fieldMappings.primary1Label}
                        onChange={(value) => updateFieldMapping('primary1Label', value)}
                        placeholder="Points Available"
                      />
                      <MergeTagInput
                        label="Primary Field 1 - Value"
                        value={fieldMappings.primary1Value}
                        onChange={(value) => updateFieldMapping('primary1Value', value)}
                        placeholder="{unused_points}"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <MergeTagInput
                        label="Primary Field 2 - Label"
                        value={fieldMappings.primary2Label}
                        onChange={(value) => updateFieldMapping('primary2Label', value)}
                        placeholder="Member Status"
                      />
                      <MergeTagInput
                        label="Primary Field 2 - Value"
                        value={fieldMappings.primary2Value}
                        onChange={(value) => updateFieldMapping('primary2Value', value)}
                        placeholder="{tier}"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <MergeTagInput
                        label="Points Field - Label"
                        value={fieldMappings.pointsLabel}
                        onChange={(value) => updateFieldMapping('pointsLabel', value)}
                        placeholder="Total Points"
                      />
                      <MergeTagInput
                        label="Points Field - Value"
                        value={fieldMappings.pointsValue}
                        onChange={(value) => updateFieldMapping('pointsValue', value)}
                        placeholder="{points}"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={applyFieldMappingsToLayout}
                        className="w-full"
                        disabled={saveStatus === 'saving'}
                      >
                        Apply to Layout
                      </Button>
                    </div>
                  </div>
                  
                  {/* Right Column: Available Tags Reference */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Available Merge Tags</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click any tag to copy to clipboard
                      </p>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {MERGE_TAGS.map((tag, index) => (
                        <div 
                          key={index}
                          className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigator.clipboard?.writeText(tag.tag)}
                        >
                          <div className="font-mono text-sm text-blue-600">{tag.tag}</div>
                          <div className="text-xs text-muted-foreground">{tag.label}</div>
                          <div className="text-xs text-gray-400">Example: {tag.example}</div>
                        </div>
                      ))}
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
                              <div className="text-sm font-medium">
                                {previewData?.header?.text || fieldMappings.headerText || 'Pass Title'}
                              </div>
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
                              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white">
                                <div className="space-y-1 text-center">
                                  {previewLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                  ) : previewError ? (
                                    <div className="text-red-200 text-xs">{previewError}</div>
                                  ) : previewData?.fields ? (
                                    <div className="space-y-1">
                                      {previewData.fields.slice(0, 2).map((field: any, index: number) => (
                                        <div key={index} className="text-xs">
                                          <span className="opacity-75">{field.label}: </span>
                                          <span className="font-medium">{field.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs">Field mappings will appear here</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {previewLoading ? (
                                  <div className="space-y-1">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                                    <div className="text-xs text-muted-foreground text-center">
                                      Loading preview...
                                    </div>
                                  </div>
                                ) : previewError ? (
                                  <div className="space-y-1">
                                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                                    <div className="text-xs text-red-500 text-center">
                                      {previewError}
                                    </div>
                                  </div>
                                ) : previewData?.fields ? (
                                  <div className="space-y-2">
                                    {previewData.fields.map((field: any, index: number) => (
                                      <div key={index} className="text-center">
                                        <div className="text-xs text-muted-foreground">{field.label}</div>
                                        <div className="text-sm font-medium">{field.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Palette className="w-6 h-6 text-muted-foreground mx-auto" />
                                    <div className="text-xs text-muted-foreground text-center">
                                      Configure fields to see preview
                                    </div>
                                  </div>
                                )}
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
                
                {/* Preview Status */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    {previewLoading && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Updating preview...</span>
                      </>
                    )}
                    {previewError && (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-red-500">Preview failed: {previewError}</span>
                      </>
                    )}
                    {!previewLoading && !previewError && previewData && (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Preview updated with resolved data</span>
                      </>
                    )}
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