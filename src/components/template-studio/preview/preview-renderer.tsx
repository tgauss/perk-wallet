'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { PassCard } from './pass-card'
import { BarcodeCanvas } from './barcode-canvas'

interface PreviewRendererProps {
  deviceType: 'apple' | 'google'
  layout: any
  assets: Record<string, string>
  showSafeArea?: boolean
  showGrid?: boolean
  programId: string
  compact?: boolean
}

export function PreviewRenderer({
  deviceType,
  layout,
  assets,
  showSafeArea = false,
  showGrid = false,
  programId,
  compact = false
}: PreviewRendererProps) {
  
  const passData = useMemo(() => {
    // Transform layout into pass-specific structure
    if (deviceType === 'apple') {
      return {
        header: layout?.header || {},
        primary: layout?.primary || [],
        secondary: layout?.secondary || [],
        auxiliary: layout?.auxiliary || [],
        footer: layout?.footer || {},
        barcode: layout?.barcode || {}
      }
    } else {
      return {
        title: layout?.header?.title || '',
        subtitle: layout?.header?.subtitle || '',
        primary: layout?.primary?.[0] || {},
        chips: layout?.secondary || [],
        heroImage: layout?.heroImage || null,
        barcode: layout?.barcode || {}
      }
    }
  }, [deviceType, layout])

  const containerClasses = compact 
    ? "w-full max-w-xs mx-auto" 
    : "w-full max-w-md mx-auto"

  return (
    <div className={`relative ${containerClasses}`}>
      {/* Grid Overlay */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '8px 8px'
          }}
        />
      )}

      {/* Safe Area Overlay */}
      {showSafeArea && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="h-full w-full border-2 border-red-400 border-dashed opacity-50" />
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-red-300 border-dashed opacity-30" />
        </div>
      )}

      {/* Pass Card */}
      <PassCard
        deviceType={deviceType}
        data={passData}
        assets={assets}
        programId={programId}
        compact={compact}
      />
    </div>
  )
}