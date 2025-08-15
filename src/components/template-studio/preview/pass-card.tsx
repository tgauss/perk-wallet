'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarcodeCanvas } from './barcode-canvas'
import { useProgramTokens } from '@/components/branding/program-theme-client'

interface PassCardProps {
  deviceType: 'apple' | 'google'
  data: any
  assets: Record<string, string>
  programId: string
  compact?: boolean
}

export function PassCard({ deviceType, data, assets, programId, compact = false }: PassCardProps) {
  const { branding } = useProgramTokens()

  const cardClasses = useMemo(() => {
    const baseClasses = "relative overflow-hidden transition-all duration-200"
    const sizeClasses = compact ? "w-full" : "w-80"
    const styleClasses = deviceType === 'apple' 
      ? "rounded-xl shadow-lg" 
      : "rounded-lg shadow-md"
    
    return `${baseClasses} ${sizeClasses} ${styleClasses}`
  }, [deviceType, compact])

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ''
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  if (deviceType === 'apple') {
    return (
      <Card 
        className={cardClasses}
        style={{ 
          backgroundColor: branding.colors.background_primary,
          borderColor: branding.colors.brand_color 
        }}
      >
        {/* Header */}
        {data.header && (
          <div 
            className="px-4 py-3 border-b"
            style={{ 
              backgroundColor: branding.colors.brand_color,
              color: '#FFFFFF',
              fontFamily: branding.fonts.header_font.family
            }}
          >
            {assets.logo && (
              <img 
                src={assets.logo} 
                alt="Logo" 
                className="h-6 w-auto mb-2"
              />
            )}
            <h3 className="font-semibold text-lg" title={data.header.title}>
              {truncateText(data.header.title || 'Add title in Fields', 20)}
            </h3>
            {data.header.subtitle && (
              <p className="text-sm opacity-90" title={data.header.subtitle}>
                {truncateText(data.header.subtitle, 30)}
              </p>
            )}
          </div>
        )}

        {/* Primary Fields */}
        {data.primary && data.primary.length > 0 && (
          <div className="px-4 py-3 space-y-2">
            {data.primary.map((field: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span 
                  className="text-sm font-medium"
                  style={{ color: branding.colors.text_secondary }}
                  title={field.label}
                >
                  {truncateText(field.label || 'Label', 15)}
                </span>
                <span 
                  className="text-lg font-bold"
                  style={{ 
                    color: branding.colors.text_primary,
                    fontFamily: branding.fonts.body_font.family
                  }}
                  title={field.value}
                >
                  {truncateText(field.value || '0', 20)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Secondary Fields */}
        {data.secondary && data.secondary.length > 0 && (
          <div className="px-4 py-2 border-t grid grid-cols-2 gap-2">
            {data.secondary.slice(0, 4).map((field: any, index: number) => (
              <div key={index} className="text-center">
                <p 
                  className="text-xs font-medium"
                  style={{ color: branding.colors.text_secondary }}
                  title={field.label}
                >
                  {truncateText(field.label || 'Label', 12)}
                </p>
                <p 
                  className="text-sm font-semibold"
                  style={{ color: branding.colors.text_primary }}
                  title={field.value}
                >
                  {truncateText(field.value || 'Value', 15)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Barcode Section */}
        <div 
          className="px-4 py-3 border-t"
          style={{ backgroundColor: branding.colors.background_secondary }}
        >
          <BarcodeCanvas 
            programId={programId}
            participantId="246785"
            passKind="loyalty"
            compact={compact}
          />
        </div>

        {/* Footer Strip */}
        <div 
          className="h-2"
          style={{ backgroundColor: branding.colors.brand_secondary_color }}
        />
      </Card>
    )
  }

  // Google Wallet Style
  return (
    <Card 
      className={cardClasses}
      style={{ 
        backgroundColor: branding.colors.background_primary,
        borderColor: branding.colors.brand_color 
      }}
    >
      {/* Hero Image Area */}
      {assets.heroImage && (
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600">
          <img 
            src={assets.heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title Section */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 
              className="font-bold text-lg"
              style={{ 
                color: branding.colors.text_primary,
                fontFamily: branding.fonts.header_font.family 
              }}
              title={data.title}
            >
              {truncateText(data.title || 'Add title in Fields', 25)}
            </h3>
            {data.subtitle && (
              <p 
                className="text-sm mt-1"
                style={{ color: branding.colors.text_secondary }}
                title={data.subtitle}
              >
                {truncateText(data.subtitle, 35)}
              </p>
            )}
          </div>
          {assets.logo && (
            <img 
              src={assets.logo} 
              alt="Logo" 
              className="h-8 w-auto ml-3"
            />
          )}
        </div>
      </div>

      {/* Primary Value */}
      {data.primary && (
        <div className="px-4 py-2">
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: branding.colors.text_secondary }}
              title={data.primary.label}
            >
              {truncateText(data.primary.label || 'Points', 15)}
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ 
                color: branding.colors.brand_color,
                fontFamily: branding.fonts.body_font.family
              }}
              title={data.primary.value}
            >
              {truncateText(data.primary.value || '0', 15)}
            </span>
          </div>
        </div>
      )}

      {/* Chips/Tags */}
      {data.chips && data.chips.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {data.chips.slice(0, 3).map((chip: any, index: number) => (
            <Badge 
              key={index} 
              variant="secondary"
              style={{ 
                backgroundColor: branding.colors.background_muted,
                color: branding.colors.text_primary
              }}
              title={`${chip.label}: ${chip.value}`}
            >
              {truncateText(`${chip.label}: ${chip.value}` || 'Tag', 20)}
            </Badge>
          ))}
        </div>
      )}

      {/* Barcode Section */}
      <div 
        className="px-4 py-3 border-t mt-2"
        style={{ backgroundColor: branding.colors.background_secondary }}
      >
        <BarcodeCanvas 
          programId={programId}
          participantId="246785"
          passKind="loyalty"
          compact={compact}
        />
      </div>
    </Card>
  )
}