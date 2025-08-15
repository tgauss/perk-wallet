'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Monitor, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Grid3X3,
  Eye,
  EyeOff
} from 'lucide-react'

interface DeviceChromeProps {
  deviceType: 'apple' | 'google'
  onDeviceToggle: (type: 'apple' | 'google') => void
  showChrome: boolean
  onChromeToggle: (show: boolean) => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  showSafeArea: boolean
  onSafeAreaToggle: (show: boolean) => void
  showGrid: boolean
  onGridToggle: (show: boolean) => void
  children: ReactNode
  compact?: boolean
}

const ZOOM_LEVELS = [75, 100, 125, 150]

export function DeviceChrome({
  deviceType,
  onDeviceToggle,
  showChrome,
  onChromeToggle,
  zoomLevel,
  onZoomChange,
  showSafeArea,
  onSafeAreaToggle,
  showGrid,
  onGridToggle,
  children,
  compact = false
}: DeviceChromeProps) {

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex > 0) {
      onZoomChange(ZOOM_LEVELS[currentIndex - 1])
    }
  }

  const handleZoomFit = () => {
    onZoomChange(100)
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <Button
              variant={deviceType === 'apple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDeviceToggle('apple')}
              className="h-6 px-2 text-xs"
            >
              iOS
            </Button>
            <Button
              variant={deviceType === 'google' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDeviceToggle('google')}
              className="h-6 px-2 text-xs"
            >
              Android
            </Button>
          </div>
        </div>
        <div className="transform-gpu" style={{ transform: `scale(0.75)`, transformOrigin: 'top center' }}>
          {showChrome ? (
            <DeviceFrame deviceType={deviceType}>
              {children}
            </DeviceFrame>
          ) : (
            children
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Device Type */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Device</label>
            <div className="flex items-center space-x-2">
              <Button
                variant={deviceType === 'apple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDeviceToggle('apple')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                iPhone
              </Button>
              <Button
                variant={deviceType === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDeviceToggle('google')}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Android
              </Button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Zoom</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel === ZOOM_LEVELS[0]}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="min-w-[60px] justify-center">
                {zoomLevel}%
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomFit}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Overlay Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Chrome</label>
              <Button
                variant={showChrome ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChromeToggle(!showChrome)}
              >
                {showChrome ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showChrome ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Grid</label>
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size="sm"
                onClick={() => onGridToggle(!showGrid)}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                {showGrid ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Safe Area</label>
              <Button
                variant={showSafeArea ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSafeAreaToggle(!showSafeArea)}
              >
                {showSafeArea ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <div 
        className="flex justify-center transform-gpu transition-transform duration-200"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        {showChrome ? (
          <DeviceFrame deviceType={deviceType}>
            {children}
          </DeviceFrame>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function DeviceFrame({ deviceType, children }: { deviceType: 'apple' | 'google', children: ReactNode }) {
  if (deviceType === 'apple') {
    return (
      <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* iPhone frame */}
        <div className="relative bg-black rounded-[2.5rem] p-2">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl z-10" />
          
          {/* Screen */}
          <div className="relative bg-white rounded-[2rem] overflow-hidden min-h-[600px] flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-gray-800 rounded-[2rem] p-4 shadow-2xl">
      {/* Android frame */}
      <div className="relative bg-black rounded-[1.5rem] overflow-hidden min-h-[600px] flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}