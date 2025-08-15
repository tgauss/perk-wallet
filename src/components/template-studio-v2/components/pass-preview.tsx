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
      <div className={cn('bg-black rounded-3xl p-3 shadow-2xl max-w-sm', className)}>
        {/* Status Bar */}
        <div className="text-white text-xs px-4 py-2 flex justify-between items-center">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
            </div>
            <svg className="w-6 h-3 ml-1" fill="white" viewBox="0 0 24 12">
              <rect x="1" y="2" width="18" height="8" rx="2" fill="none" stroke="white" strokeWidth="1"/>
              <rect x="20" y="4" width="2" height="4" rx="1" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Screen */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden">
          {/* Navigation */}
          <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
            <span className="text-blue-500 text-sm">Back</span>
            <span className="font-semibold text-sm">{design.logoText}</span>
            <span className="text-blue-500 text-sm">...</span>
          </div>

          {/* Pass Content */}
          <div className="p-3 bg-gray-100">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Cover Image */}
              {coverUrl && (
                <div className="h-24 bg-cover bg-center relative" style={{ backgroundImage: `url(${coverUrl})` }}>
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>
              )}

              {/* Pass Header */}
              <div className="px-4 py-3" style={{ backgroundColor: design.backgroundColor }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-8 mb-2 brightness-0 invert" />
                    ) : (
                      <div className="text-white font-bold text-lg mb-1">{design.logoText}</div>
                    )}
                    <div className="text-white text-sm opacity-90">
                      {design.topField.value.replace(/\{program_name\}/g, 'Huskers Rewards')}
                    </div>
                  </div>
                  {design.fields.length > 0 && (
                    <div className="text-right">
                      <div className="text-white text-xs opacity-75 uppercase tracking-wide">
                        {design.fields[0].label}
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {design.fields[0].value.replace(/\{[^}]+\}/g, (match) => {
                          const tagMap: Record<string, string> = {
                            '{full_name}': 'John Doe',
                            '{tier}': 'Gold',
                            '{status}': 'Active'
                          }
                          return tagMap[match] || match
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Fields */}
              {design.fields.length > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    {design.fields.slice(1).map((field) => (
                      <div key={field.id}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          {field.label}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {field.value.replace(/\{[^}]+\}/g, (match) => {
                            const tagMap: Record<string, string> = {
                              '{points}': '1,250',
                              '{unused_points}': '750',
                              '{email}': 'john@example.com'
                            }
                            return tagMap[match] || match
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barcode */}
              <div className="px-4 py-6 bg-white text-center">
                <div className="inline-block p-2 bg-white border border-gray-200 rounded">
                  <QrCode className="w-16 h-16 text-gray-800" />
                </div>
                <div className="text-xs text-gray-600 mt-2 font-mono">
                  {design.barcode.caption.replace(/\{perk_id\}/g, '246785')}
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
    <div className={cn('bg-gray-800 rounded-2xl p-2 shadow-2xl max-w-sm', className)}>
      {/* Status Bar */}
      <div className="bg-gray-900 text-white text-xs px-4 py-1 flex justify-between items-center rounded-t-xl">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <div className="ml-2 text-xs">100%</div>
        </div>
      </div>

      {/* Screen */}
      <div className="bg-white rounded-b-xl overflow-hidden">
        {/* App Bar */}
        <div className="bg-white px-4 py-3 flex items-center shadow-sm">
          <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          <span className="ml-2 font-medium text-gray-900">{design.logoText}</span>
        </div>

        {/* Pass Content */}
        <div className="p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Cover Image */}
            {coverUrl && (
              <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
            )}

            {/* Pass Header */}
            <div className="p-4" style={{ backgroundColor: design.backgroundColor }}>
              <div className="flex items-center justify-between">
                <div>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-6 brightness-0 invert mb-1" />
                  ) : (
                    <div className="text-white font-bold text-base mb-1">{design.logoText}</div>
                  )}
                  <div className="text-white text-xs opacity-90">
                    {design.topField.value.replace(/\{program_name\}/g, 'Huskers Rewards')}
                  </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
                </div>
              </div>
            </div>

            {/* Material Design Cards */}
            <div className="p-4 space-y-3">
              {design.fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                    {field.label}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {field.value.replace(/\{[^}]+\}/g, (match) => {
                      const tagMap: Record<string, string> = {
                        '{full_name}': 'John Doe',
                        '{points}': '1,250',
                        '{unused_points}': '750',
                        '{tier}': 'Gold',
                        '{status}': 'Active'
                      }
                      return tagMap[match] || match
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Barcode Section */}
            <div className="px-4 pb-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-xs text-gray-600 font-mono">
                  {design.barcode.caption.replace(/\{perk_id\}/g, '246785')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="bg-gray-900 px-4 py-2 flex justify-center rounded-b-xl">
        <div className="flex gap-2">
          <div className="w-8 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white opacity-50 rounded-full self-center"></div>
          <div className="w-1 h-1 bg-white opacity-50 rounded-full self-center"></div>
        </div>
      </div>
    </div>
  )
}