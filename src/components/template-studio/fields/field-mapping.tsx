'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Plus, Minus, Zap, Search } from 'lucide-react'
import { MergeTagPalette } from './merge-tag-palette'
import { validateTemplate } from '@/lib/mergeTags'

interface FieldMappingProps {
  layout: any
  onChange: (newLayout: any) => void
  programId: string
}

interface FieldValidation {
  field: string
  unknownTags: string[]
  warnings: string[]
}

export function FieldMapping({ layout, onChange, programId }: FieldMappingProps) {
  const [showMergeTagPalette, setShowMergeTagPalette] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<FieldValidation[]>([])
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  // Validate all fields for unknown tags
  const validateAllFields = useCallback((layoutData: any) => {
    const results: FieldValidation[] = []
    
    const validateField = (path: string, value: string) => {
      const validation = validateTemplate(value)
      if (!validation.valid) {
        results.push({
          field: path,
          unknownTags: validation.unknownTags,
          warnings: validation.warnings
        })
      }
    }

    // Validate header fields
    if (layoutData.header?.title) {
      validateField('header.title', layoutData.header.title)
    }
    if (layoutData.header?.subtitle) {
      validateField('header.subtitle', layoutData.header.subtitle)
    }

    // Validate primary fields
    layoutData.primary?.forEach((field: any, index: number) => {
      if (field.label) validateField(`primary.${index}.label`, field.label)
      if (field.value) validateField(`primary.${index}.value`, field.value)
    })

    // Validate secondary fields
    layoutData.secondary?.forEach((field: any, index: number) => {
      if (field.label) validateField(`secondary.${index}.label`, field.label)
      if (field.value) validateField(`secondary.${index}.value`, field.value)
    })

    setValidationResults(results)
  }, [])

  // Handle layout changes
  const handleLayoutChange = useCallback((newLayout: any) => {
    validateAllFields(newLayout)
    onChange(newLayout)
  }, [onChange, validateAllFields])

  // Insert merge tag at cursor position
  const insertMergeTag = useCallback((tag: string) => {
    if (!activeField) return

    const textarea = textareaRefs.current[activeField]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const newText = text.substring(0, start) + `{${tag}}` + text.substring(end)
    
    // Update the field value
    const fieldPath = activeField.split('.')
    const newLayout = JSON.parse(JSON.stringify(layout))
    
    let target = newLayout
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i]
      if (key.includes('[')) {
        const [arrayKey, index] = key.split('[')
        const arrayIndex = parseInt(index.replace(']', ''))
        target = target[arrayKey][arrayIndex]
      } else {
        target = target[key]
      }
    }
    
    const finalKey = fieldPath[fieldPath.length - 1]
    target[finalKey] = newText
    
    handleLayoutChange(newLayout)
    
    // Close palette and restore focus
    setShowMergeTagPalette(false)
    setActiveField(null)
    
    // Set cursor position after inserted tag
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2)
    }, 0)
  }, [activeField, layout, handleLayoutChange])

  // Handle field focus for merge tag insertion
  const handleFieldFocus = useCallback((fieldPath: string) => {
    setActiveField(fieldPath)
  }, [])

  // Check for unknown tags in specific field
  const getFieldValidation = useCallback((fieldPath: string) => {
    return validationResults.find(result => result.field === fieldPath)
  }, [validationResults])

  // Update specific field
  const updateField = useCallback((path: string, value: string) => {
    const fieldPath = path.split('.')
    const newLayout = JSON.parse(JSON.stringify(layout))
    
    let target = newLayout
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i]
      if (key.includes('[')) {
        const [arrayKey, index] = key.split('[')
        const arrayIndex = parseInt(index.replace(']', ''))
        if (!target[arrayKey]) target[arrayKey] = []
        if (!target[arrayKey][arrayIndex]) target[arrayKey][arrayIndex] = {}
        target = target[arrayKey][arrayIndex]
      } else {
        if (!target[key]) target[key] = {}
        target = target[key]
      }
    }
    
    const finalKey = fieldPath[fieldPath.length - 1]
    target[finalKey] = value
    
    handleLayoutChange(newLayout)
  }, [layout, handleLayoutChange])

  // Add new field to array
  const addField = useCallback((arrayPath: string) => {
    const newLayout = JSON.parse(JSON.stringify(layout))
    if (!newLayout[arrayPath]) newLayout[arrayPath] = []
    newLayout[arrayPath].push({ label: '', value: '' })
    handleLayoutChange(newLayout)
  }, [layout, handleLayoutChange])

  // Remove field from array
  const removeField = useCallback((arrayPath: string, index: number) => {
    const newLayout = JSON.parse(JSON.stringify(layout))
    if (newLayout[arrayPath]) {
      newLayout[arrayPath].splice(index, 1)
      handleLayoutChange(newLayout)
    }
  }, [layout, handleLayoutChange])

  // Initialize validation
  useState(() => {
    validateAllFields(layout)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Field Controls */}
      <div className="space-y-6 overflow-y-auto">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Header</span>
              {getFieldValidation('header.title') && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unknown tags
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header-title">Title</Label>
              <div className="relative">
                <Input
                  id="header-title"
                  value={layout.header?.title || ''}
                  onChange={(e) => updateField('header.title', e.target.value)}
                  onFocus={() => handleFieldFocus('header.title')}
                  placeholder="Enter title or use merge tags like {program_name}"
                  className={getFieldValidation('header.title') ? 'border-red-500' : ''}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => {
                    setActiveField('header.title')
                    setShowMergeTagPalette(true)
                  }}
                >
                  <Zap className="h-3 w-3" />
                </Button>
              </div>
              {getFieldValidation('header.title') && (
                <div className="text-xs text-red-600">
                  Unknown tags: {getFieldValidation('header.title')!.unknownTags.map(tag => `{${tag}}`).join(', ')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="header-subtitle">Subtitle</Label>
              <div className="relative">
                <Input
                  id="header-subtitle"
                  value={layout.header?.subtitle || ''}
                  onChange={(e) => updateField('header.subtitle', e.target.value)}
                  onFocus={() => handleFieldFocus('header.subtitle')}
                  placeholder="Enter subtitle or use merge tags"
                  className={getFieldValidation('header.subtitle') ? 'border-red-500' : ''}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => {
                    setActiveField('header.subtitle')
                    setShowMergeTagPalette(true)
                  }}
                >
                  <Zap className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Fields */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Primary Fields</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addField('primary')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(layout.primary || []).map((field: any, index: number) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Primary Field {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField('primary', index)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <div className="relative">
                      <Input
                        value={field.label || ''}
                        onChange={(e) => updateField(`primary[${index}].label`, e.target.value)}
                        onFocus={() => handleFieldFocus(`primary.${index}.label`)}
                        placeholder="Field label"
                        className={getFieldValidation(`primary.${index}.label`) ? 'border-red-500' : ''}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => {
                          setActiveField(`primary.${index}.label`)
                          setShowMergeTagPalette(true)
                        }}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <div className="relative">
                      <Input
                        value={field.value || ''}
                        onChange={(e) => updateField(`primary[${index}].value`, e.target.value)}
                        onFocus={() => handleFieldFocus(`primary.${index}.value`)}
                        placeholder="Use {points} or other tags"
                        className={getFieldValidation(`primary.${index}.value`) ? 'border-red-500' : ''}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => {
                          setActiveField(`primary.${index}.value`)
                          setShowMergeTagPalette(true)
                        }}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {(getFieldValidation(`primary.${index}.label`) || getFieldValidation(`primary.${index}.value`)) && (
                  <div className="text-xs text-red-600">
                    Unknown tags found in this field
                  </div>
                )}
              </div>
            ))}
            
            {(!layout.primary || layout.primary.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No primary fields added yet</p>
                <p className="text-xs">Primary fields are prominently displayed on the pass</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secondary Fields */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Secondary Fields</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addField('secondary')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(layout.secondary || []).map((field: any, index: number) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Secondary Field {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField('secondary', index)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <div className="relative">
                      <Input
                        value={field.label || ''}
                        onChange={(e) => updateField(`secondary[${index}].label`, e.target.value)}
                        onFocus={() => handleFieldFocus(`secondary.${index}.label`)}
                        placeholder="Field label"
                        className={getFieldValidation(`secondary.${index}.label`) ? 'border-red-500' : ''}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => {
                          setActiveField(`secondary.${index}.label`)
                          setShowMergeTagPalette(true)
                        }}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <div className="relative">
                      <Input
                        value={field.value || ''}
                        onChange={(e) => updateField(`secondary[${index}].value`, e.target.value)}
                        onFocus={() => handleFieldFocus(`secondary.${index}.value`)}
                        placeholder="Use {tier} or other tags"
                        className={getFieldValidation(`secondary.${index}.value`) ? 'border-red-500' : ''}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => {
                          setActiveField(`secondary.${index}.value`)
                          setShowMergeTagPalette(true)
                        }}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(!layout.secondary || layout.secondary.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No secondary fields added yet</p>
                <p className="text-xs">Secondary fields provide additional context</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Merge Tag Catalog */}
      <div className="space-y-4">
        <MergeTagPalette
          programId={programId}
          onTagSelect={insertMergeTag}
          isOpen={showMergeTagPalette}
          onOpenChange={setShowMergeTagPalette}
        />
      </div>
    </div>
  )
}