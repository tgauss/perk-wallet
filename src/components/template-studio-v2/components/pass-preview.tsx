'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { QrCode } from 'lucide-react'

interface PassPreviewProps {
  device: 'ios' | 'android'
  design: {
    backgroundColor: string
    labelColor: string
    valueColor: string
    logo?: File | null
    icon?: File | null
    coverImage?: File | null
    logoText: string
    fields: Array<{ id: string; label: string; value: string }>
    barcode: {
      type: string
      data: string
      caption: string
    }
  }
  className?: string
}

export function PassPreview({ device, design, className }: PassPreviewProps) {
  const logoUrl = useMemo(() => {
    if (design.logo instanceof File) {
      return URL.createObjectURL(design.logo)
    }
    return null
  }, [design.logo])

  const coverUrl = useMemo(() => {
    if (design.coverImage instanceof File) {
      return URL.createObjectURL(design.coverImage)
    }
    return null
  }, [design.coverImage])

  if (device === 'ios') {
    return (
      <div className={cn('bg-black rounded-3xl p-3 shadow-2xl', className)}>
        {/* Status Bar */}
        <div className="text-white text-xs px-4 py-2 flex justify-between items-center">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48zm17.7.75l.85 1.48L23 13.7l-.85-1.48-1.3.75zM11 13.5v-6c-1.11.35-2 1.34-2 2.5s.89 2.15 2 2.5zm1-9.5c-4.42 0-8 3.58-8 8 0 1.21.27 2.36.75 3.39l1.13-1.13A5.934 5.934 0 016 10c0-3.31 2.69-6 6-6s6 2.69 6 6c0 1.66-.67 3.16-1.76 4.24l1.13 1.13C18.37 14.36 19 12.71 19 11c0-4.42-3.58-8-8-8z"/>
            </svg>
            <svg className="w-5 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 17h20v2H2zm0-5h20v2H2zm0-5h20v2H2z"/>
            </svg>
            <svg className="w-6 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            </svg>
          </div>
        </div>

        {/* Screen */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden" style={{ minHeight: '600px' }}>
          {/* Navigation */}
          <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
            <span className="text-blue-500">Edit</span>
            <span className="font-semibold">Pass</span>
            <span className="text-blue-500">Done</span>
          </div>

          {/* Pass Content */}
          <div className="p-4">
            <div 
              className="rounded-xl shadow-lg overflow-hidden"
              style={{ backgroundColor: design.backgroundColor }}
            >
              {/* Cover Image */}
              {coverUrl && (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
              )}

              {/* Header */}
              <div className="p-4 text-white">
                <div className="flex items-center justify-between mb-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-12" />
                  ) : (
                    <div className="text-lg font-bold">{design.logoText}</div>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {design.fields.map((field) => (
                    <div key={field.id}>
                      <div className="text-xs opacity-75 uppercase" style={{ color: design.labelColor }}>
                        {field.label}
                      </div>
                      <div className="font-semibold" style={{ color: design.valueColor }}>
                        {field.value.replace(/\{[^}]+\}/g, (match) => {
                          const tagMap: Record<string, string> = {
                            '{full_name}': 'John Doe',
                            '{fname}': 'John',
                            '{lname}': 'Doe',
                            '{email}': 'john@example.com',
                            '{points}': '1,250',
                            '{unused_points}': '750',
                            '{tier}': 'Gold',
                            '{status}': 'Active',
                            '{program_name}': 'Huskers Rewards',
                            '{perk_id}': '246785'
                          }
                          return tagMap[match] || match
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-white p-4">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{design.barcode.caption}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="mt-2 flex justify-center">
          <div className="w-32 h-1 bg-white rounded-full opacity-50" />
        </div>
      </div>
    )
  }

  // Android Preview
  return (
    <div className={cn('bg-gray-800 rounded-2xl p-2 shadow-2xl', className)}>
      {/* Status Bar */}
      <div className="bg-gray-900 text-white text-xs px-4 py-1 flex justify-between items-center rounded-t-xl">
        <span>9:41 AM</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Screen */}
      <div className="bg-white rounded-b-xl overflow-hidden" style={{ minHeight: '600px' }}>
        {/* App Bar */}
        <div className="bg-white px-4 py-3 flex items-center border-b">
          <span className="text-xl">←</span>
          <span className="ml-4 font-medium">Wallet Pass</span>
        </div>

        {/* Pass Content */}
        <div className="p-4">
          <div className="rounded-lg shadow-lg overflow-hidden bg-white border">
            {/* Cover */}
            {coverUrl && (
              <img src={coverUrl} alt="Cover" className="w-full h-24 object-cover" />
            )}

            {/* Content */}
            <div 
              className="p-4"
              style={{ backgroundColor: design.backgroundColor }}
            >
              <div className="flex items-center justify-between mb-4 text-white">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 brightness-0 invert" />
                ) : (
                  <div className="text-lg font-bold">{design.logoText}</div>
                )}
              </div>

              {/* Fields as Chips */}
              <div className="flex flex-wrap gap-2">
                {design.fields.map((field) => (
                  <div 
                    key={field.id} 
                    className="bg-white/20 px-3 py-1 rounded-full text-white text-sm"
                  >
                    <span className="opacity-75">{field.label}:</span>{' '}
                    <span className="font-medium">
                      {field.value.replace(/\{[^}]+\}/g, (match) => {
                        const tagMap: Record<string, string> = {
                          '{full_name}': 'John Doe',
                          '{points}': '1,250',
                          '{tier}': 'Gold',
                          '{status}': 'Active'
                        }
                        return tagMap[match] || match
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Barcode */}
            <div className="bg-gray-50 p-4">
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 mt-2">{design.barcode.caption}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-gray-900 px-4 py-2 flex justify-around rounded-b-xl">
        <span className="text-white">◀</span>
        <span className="text-white">●</span>
        <span className="text-white">■</span>
      </div>
    </div>
  )
}