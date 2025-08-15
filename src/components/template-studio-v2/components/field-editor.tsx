'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings2, X, Hash, User, Mail, Building, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  placeholder?: string
  showMergeTags?: boolean
  removable?: boolean
}

const MERGE_TAGS = [
  { icon: User, label: 'Full Name', value: '{full_name}' },
  { icon: User, label: 'First Name', value: '{fname}' },
  { icon: User, label: 'Last Name', value: '{lname}' },
  { icon: Mail, label: 'Email', value: '{email}' },
  { icon: Hash, label: 'Points', value: '{points}' },
  { icon: Hash, label: 'Unused Points', value: '{unused_points}' },
  { icon: Tag, label: 'Status', value: '{status}' },
  { icon: Tag, label: 'Tier', value: '{tier}' },
  { icon: Building, label: 'Program Name', value: '{program_name}' },
  { icon: Hash, label: 'Participant ID', value: '{perk_id}' },
]

export function FieldEditor({
  label,
  value,
  onChange,
  onRemove,
  placeholder = 'Enter value or select merge tag',
  showMergeTags = true,
  removable = false
}: FieldEditorProps) {
  const [showPalette, setShowPalette] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setShowPalette(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTags = MERGE_TAGS.filter(tag =>
    tag.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const insertTag = (tag: string) => {
    onChange(tag)
    setShowPalette(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <Label className="block mb-2 text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (showMergeTags && value.startsWith('{')) {
                setShowPalette(true)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === '{' && showMergeTags) {
                setShowPalette(true)
              }
            }}
            placeholder={placeholder}
            className="pr-10"
          />
          {showMergeTags && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowPalette(!showPalette)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {removable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Merge Tag Palette */}
      {showPalette && showMergeTags && (
        <div
          ref={paletteRef}
          className="absolute z-50 top-full mt-2 w-full bg-white rounded-lg shadow-lg border p-2 max-h-64 overflow-y-auto"
        >
          <div className="sticky top-0 bg-white pb-2 mb-2 border-b">
            <Input
              placeholder="Search merge tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          
          <div className="space-y-1">
            {filteredTags.map((tag) => (
              <button
                key={tag.value}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 text-left transition-colors"
                onClick={() => insertTag(tag.value)}
              >
                <tag.icon className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{tag.label}</div>
                  <div className="text-xs text-gray-500 font-mono">{tag.value}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}