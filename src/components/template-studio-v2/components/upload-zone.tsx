'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  label: string
  description?: string
  accept?: string
  maxSize?: number
  dimensions?: string
  value?: File | string | null
  onChange: (file: File | null) => void
  className?: string
  preview?: boolean
}

export function UploadZone({
  label,
  description,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  dimensions,
  value,
  onChange,
  className,
  preview = true
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    onChange(file)
    
    if (preview) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setPreviewUrl(null)
  }

  const hasValue = value || previewUrl

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          hasValue ? 'p-4' : 'p-8',
          'cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {hasValue ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {typeof value === 'string' ? 'Uploaded file' : value?.name}
                </p>
                {typeof value === 'object' && value && (
                  <p className="text-xs text-gray-500">
                    {(value.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                handleRemove()
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">
              Click to upload or drag and drop
            </p>
            {dimensions && (
              <p className="text-xs text-gray-500">{dimensions}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}