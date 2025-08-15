'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Grid3X3, Eye, EyeOff } from 'lucide-react'

interface OverlayControlsProps {
  showSafeArea: boolean
  onSafeAreaToggle: (show: boolean) => void
  showGrid: boolean
  onGridToggle: (show: boolean) => void
}

export function OverlayControls({
  showSafeArea,
  onSafeAreaToggle,
  showGrid,
  onGridToggle
}: OverlayControlsProps) {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Overlays</h4>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Safe Area</span>
          <Button
            variant={showSafeArea ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSafeAreaToggle(!showSafeArea)}
          >
            {showSafeArea ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Grid</span>
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGridToggle(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}