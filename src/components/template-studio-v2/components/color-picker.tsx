'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pipette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  presets?: string[]
}

const DEFAULT_PRESETS = [
  '#D00000', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#000000', // Black
  '#FFFFFF', // White
]

export function ColorPicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempColor, setTempColor] = useState(value)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleColorChange = (color: string) => {
    setTempColor(color)
    onChange(color)
  }

  return (
    <div className="relative">
      <Label className="block mb-2 text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Pipette className="w-4 h-4" />
        </Button>
      </div>

      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute z-50 top-full mt-2 bg-white rounded-lg shadow-lg border p-4"
        >
          <div className="space-y-3">
            {/* Native Color Picker */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={tempColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>

            {/* Preset Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-10 h-10 rounded border-2 cursor-pointer transition-all',
                      value === color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Recent Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Recent</p>
              <div className="flex gap-2">
                {['#FF6B6B', '#4ECDC4', '#45B7D1'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer hover:border-gray-400"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}