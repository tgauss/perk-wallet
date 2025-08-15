'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface AssetValidatorProps {
  assets: Record<string, string>
  layout: any
  onChange: (assets: Record<string, string>) => void
}

interface AssetSlot {
  key: string
  name: string
  description: string
  recommended: {
    width: number
    height: number
    aspectRatio: string
    formats: string[]
    maxSize: string
  }
  required: boolean
}

interface AssetValidation {
  status: 'valid' | 'warning' | 'error' | 'missing'
  message: string
  details?: string[]
}

const ASSET_SLOTS: AssetSlot[] = [
  {
    key: 'logo',
    name: 'Logo',
    description: 'Main program logo displayed in header',
    recommended: {
      width: 480,
      height: 480,
      aspectRatio: '1:1 (Square)',
      formats: ['PNG', 'SVG'],
      maxSize: '2MB'
    },
    required: true
  },
  {
    key: 'strip',
    name: 'Strip Image',
    description: 'Background strip for Apple Wallet passes',
    recommended: {
      width: 640,
      height: 246,
      aspectRatio: '2.6:1',
      formats: ['PNG', 'JPG'],
      maxSize: '1MB'
    },
    required: false
  },
  {
    key: 'background',
    name: 'Background',
    description: 'Full background image for the pass',
    recommended: {
      width: 640,
      height: 1136,
      aspectRatio: '9:16',
      formats: ['PNG', 'JPG'],
      maxSize: '3MB'
    },
    required: false
  },
  {
    key: 'heroImage',
    name: 'Hero Image',
    description: 'Large featured image for Google Wallet',
    recommended: {
      width: 1032,
      height: 336,
      aspectRatio: '3:1',
      formats: ['PNG', 'JPG'],
      maxSize: '2MB'
    },
    required: false
  },
  {
    key: 'icon',
    name: 'Icon',
    description: 'Small icon for notifications and lists',
    recommended: {
      width: 192,
      height: 192,
      aspectRatio: '1:1 (Square)',
      formats: ['PNG'],
      maxSize: '512KB'
    },
    required: false
  }
]

export function AssetValidator({ assets, layout, onChange }: AssetValidatorProps) {
  const [uploadingAssets, setUploadingAssets] = useState<Record<string, boolean>>({})
  const [validationResults, setValidationResults] = useState<Record<string, AssetValidation>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Check if asset is referenced in layout
  const isAssetUsedInLayout = useCallback((assetKey: string) => {
    const layoutStr = JSON.stringify(layout)
    return layoutStr.includes(assetKey)
  }, [layout])

  // Validate a single asset
  const validateAsset = useCallback(async (assetKey: string, assetUrl: string): Promise<AssetValidation> => {
    try {
      const slot = ASSET_SLOTS.find(s => s.key === assetKey)
      if (!slot) {
        return { status: 'error', message: 'Unknown asset type' }
      }

      // Load image to check dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise((resolve) => {
        img.onload = () => {
          const { width, height } = img
          const aspectRatio = width / height
          const expectedRatio = slot.recommended.width / slot.recommended.height
          const ratioTolerance = 0.1
          
          const issues: string[] = []
          let status: AssetValidation['status'] = 'valid'

          // Check dimensions
          if (width < slot.recommended.width * 0.8 || height < slot.recommended.height * 0.8) {
            issues.push(`Resolution too low (${width}×${height}). Recommended: ${slot.recommended.width}×${slot.recommended.height}`)
            status = 'warning'
          }

          // Check aspect ratio
          if (Math.abs(aspectRatio - expectedRatio) > ratioTolerance) {
            issues.push(`Aspect ratio mismatch. Expected: ${slot.recommended.aspectRatio}`)
            status = 'warning'
          }

          // Check if oversized
          if (width > slot.recommended.width * 2 || height > slot.recommended.height * 2) {
            issues.push(`Image may be too large. Consider optimizing for web.`)
            status = status === 'error' ? 'error' : 'warning'
          }

          resolve({
            status,
            message: status === 'valid' ? 'Valid asset' : `${issues.length} issue(s) found`,
            details: issues
          })
        }

        img.onerror = () => {
          resolve({
            status: 'error',
            message: 'Failed to load image',
            details: ['Image could not be loaded or is corrupted']
          })
        }

        img.src = assetUrl
      })
    } catch (error) {
      return {
        status: 'error',
        message: 'Validation failed',
        details: ['Unexpected error during validation']
      }
    }
  }, [])

  // Validate all assets
  const validateAllAssets = useCallback(async () => {
    const results: Record<string, AssetValidation> = {}
    
    for (const slot of ASSET_SLOTS) {
      if (assets[slot.key]) {
        results[slot.key] = await validateAsset(slot.key, assets[slot.key])
      } else if (slot.required || isAssetUsedInLayout(slot.key)) {
        results[slot.key] = {
          status: slot.required ? 'error' : 'warning',
          message: slot.required ? 'Required asset missing' : 'Asset used in layout but not uploaded',
          details: [`${slot.name} is referenced in your template but no file has been uploaded`]
        }
      } else {
        results[slot.key] = {
          status: 'missing',
          message: 'Not uploaded',
        }
      }
    }
    
    setValidationResults(results)
  }, [assets, validateAsset, isAssetUsedInLayout])

  // Handle file upload
  const handleFileUpload = useCallback(async (assetKey: string, file: File) => {
    const slot = ASSET_SLOTS.find(s => s.key === assetKey)
    if (!slot) return

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedFormats = slot.recommended.formats.map(f => f.toLowerCase())
    
    if (fileExtension && !allowedFormats.includes(fileExtension)) {
      toast.error(`Invalid file format. Expected: ${slot.recommended.formats.join(', ')}`)
      return
    }

    // Check file size (convert maxSize string to bytes)
    const maxSizeBytes = parseSize(slot.recommended.maxSize)
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size: ${slot.recommended.maxSize}`)
      return
    }

    setUploadingAssets(prev => ({ ...prev, [assetKey]: true }))

    try {
      // TODO: Implement actual file upload to Supabase Storage
      // For now, create a local object URL
      const objectUrl = URL.createObjectURL(file)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newAssets = { ...assets, [assetKey]: objectUrl }
      onChange(newAssets)
      
      // Validate the new asset
      const validation = await validateAsset(assetKey, objectUrl)
      setValidationResults(prev => ({ ...prev, [assetKey]: validation }))
      
      toast.success(`${slot.name} uploaded successfully`)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploadingAssets(prev => ({ ...prev, [assetKey]: false }))
    }
  }, [assets, onChange, validateAsset])

  // Handle file input change
  const handleFileInputChange = useCallback((assetKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(assetKey, file)
    }
  }, [handleFileUpload])

  // Remove asset
  const removeAsset = useCallback((assetKey: string) => {
    const newAssets = { ...assets }
    delete newAssets[assetKey]
    onChange(newAssets)
    
    // Update validation
    setValidationResults(prev => ({
      ...prev,
      [assetKey]: {
        status: 'missing',
        message: 'Not uploaded'
      }
    }))
    
    toast.success('Asset removed')
  }, [assets, onChange])

  // Parse size string to bytes
  const parseSize = (sizeStr: string): number => {
    const units: Record<string, number> = {
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    }
    
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)$/)
    if (!match) return 0
    
    const [, size, unit] = match
    return parseFloat(size) * units[unit]
  }

  // Get status badge props
  const getStatusBadge = (validation: AssetValidation) => {
    switch (validation.status) {
      case 'valid':
        return { variant: 'secondary' as const, icon: CheckCircle2, className: 'text-green-600' }
      case 'warning':
        return { variant: 'outline' as const, icon: AlertTriangle, className: 'text-yellow-600' }
      case 'error':
        return { variant: 'destructive' as const, icon: AlertTriangle, className: '' }
      case 'missing':
      default:
        return { variant: 'outline' as const, icon: ImageIcon, className: 'text-muted-foreground' }
    }
  }

  // Run validation on mount and when assets change
  useState(() => {
    validateAllAssets()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Validator</h2>
          <p className="text-muted-foreground">
            Upload and validate images for your wallet pass template
          </p>
        </div>
        <Button variant="outline" onClick={validateAllAssets}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-validate All
        </Button>
      </div>

      {/* Asset Slots */}
      <div className="grid gap-6">
        {ASSET_SLOTS.map((slot) => {
          const hasAsset = !!assets[slot.key]
          const validation = validationResults[slot.key]
          const statusBadge = validation ? getStatusBadge(validation) : getStatusBadge({ status: 'missing', message: '' })
          const isUploading = uploadingAssets[slot.key]
          const isUsedInLayout = isAssetUsedInLayout(slot.key)

          return (
            <Card key={slot.key} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{slot.name}</span>
                      {slot.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {isUsedInLayout && !slot.required && (
                        <Badge variant="secondary" className="text-xs">Used in Layout</Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={statusBadge.variant} className={statusBadge.className}>
                      <statusBadge.icon className="w-3 h-3 mr-1" />
                      {validation?.message || 'Not uploaded'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{slot.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current Asset */}
                {hasAsset && (
                  <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                    <div className="flex-shrink-0">
                      <img 
                        src={assets[slot.key]} 
                        alt={slot.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Current {slot.name}
                      </p>
                      {validation?.details && validation.details.length > 0 && (
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          {validation.details.map((detail, index) => (
                            <li key={index}>• {detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(assets[slot.key], '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAsset(slot.key)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Recommended Specs</h5>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Size: {slot.recommended.width}×{slot.recommended.height}px</p>
                      <p>• Aspect Ratio: {slot.recommended.aspectRatio}</p>
                      <p>• Formats: {slot.recommended.formats.join(', ')}</p>
                      <p>• Max Size: {slot.recommended.maxSize}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant={hasAsset ? "outline" : "default"}
                        className="flex-1"
                        disabled={isUploading}
                        onClick={() => fileInputRefs.current[slot.key]?.click()}
                      >
                        {isUploading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {hasAsset ? 'Replace' : 'Upload'}
                          </>
                        )}
                      </Button>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-muted-foreground">Uploading and validating...</p>
                      </div>
                    )}

                    <input
                      ref={(el) => fileInputRefs.current[slot.key] = el}
                      type="file"
                      className="hidden"
                      accept={slot.recommended.formats.map(f => `.${f.toLowerCase()}`).join(',')}
                      onChange={(e) => handleFileInputChange(slot.key, e)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}