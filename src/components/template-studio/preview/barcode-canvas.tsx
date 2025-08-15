'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'

interface BarcodeCanvasProps {
  programId: string
  participantId: string
  passKind: string
  compact?: boolean
}

export function BarcodeCanvas({ 
  programId, 
  participantId, 
  passKind, 
  compact = false 
}: BarcodeCanvasProps) {
  
  const qrString = useMemo(() => {
    // Generate the QR grammar string as specified (no "v1")
    return `${programId}.${participantId}.${passKind}`
  }, [programId, participantId, passKind])

  const size = compact ? 80 : 120

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* QR Code Placeholder */}
      <div 
        className="bg-white border-2 border-gray-300 flex items-center justify-center"
        style={{ 
          width: size, 
          height: size,
          background: `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='qr' width='8' height='8' patternUnits='userSpaceOnUse'%3E%3Crect width='4' height='4' fill='%23000'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23000'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23qr)'/%3E%3C/svg%3E")`
        }}
      >
        <span className="text-xs font-mono text-white bg-black bg-opacity-50 px-1 py-0.5 rounded">
          QR
        </span>
      </div>

      {/* QR String */}
      <div className="text-center">
        <p className="text-xs font-mono text-muted-foreground break-all max-w-32">
          {qrString}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sample QR payload
        </p>
      </div>
    </div>
  )
}