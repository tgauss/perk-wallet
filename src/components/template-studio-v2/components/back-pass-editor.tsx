'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Plus, X, Link as LinkIcon, Type, Zap, Trash2 } from 'lucide-react'

interface BackPassItem {
  id: string
  type: 'link' | 'text'
  title?: string
  content: string
  clicks?: number
}

interface BackPassEditorProps {
  items: BackPassItem[]
  onChange: (items: BackPassItem[]) => void
}

export function BackPassEditor({ items, onChange }: BackPassEditorProps) {
  const addLink = () => {
    const newLink: BackPassItem = {
      id: String(Date.now()),
      type: 'link',
      title: '',
      content: '',
      clicks: 0
    }
    onChange([...items, newLink])
  }

  const addTextField = () => {
    const newText: BackPassItem = {
      id: String(Date.now()),
      type: 'text',
      content: ''
    }
    onChange([...items, newText])
  }

  const updateItem = (id: string, updates: Partial<BackPassItem>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id)
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < items.length - 1)
    ) {
      const newItems = [...items]
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      ;[newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]]
      onChange(newItems)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Name your pass</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pass-name">User-facing name (required)</Label>
            <Input 
              id="pass-name" 
              defaultValue="Huskers Rewards ID" 
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Add a descriptor to the end of your pass name (Pass, Membership, Ticket)
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Back of Pass Content */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Add content to the pass</h2>
        <p className="text-sm text-gray-600 mb-4">
          We automatically track link clicks, and add attribution link parameters that will be visible in your 
          own analytics tools (e.g., Google Analytics)
        </p>

        {/* Add Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addLink}
            className="flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Add a Link
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addTextField}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Add a Text Field
          </Button>
        </div>

        {/* Help Text */}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Not sure what to add?</p>
            <Button variant="link" className="text-blue-600">
              See Examples
            </Button>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              {item.type === 'link' ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      Link
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        ↓
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        value={item.title || ''}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="Black Friday Deals"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-yellow-500">
                        <Zap className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        ↑
                      </Button>
                      <Button variant="ghost" size="icon">
                        ↓
                      </Button>
                    </div>
                  </div>

                  <Input
                    value={item.content}
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    placeholder="https://shop.raregoods.com/products/nebraska-holiday-ornaments..."
                  />

                  {typeof item.clicks === 'number' && (
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                      <LinkIcon className="w-3 h-3" />
                      <span>{item.clicks} Clicks</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Type className="w-4 h-4 text-green-500" />
                      Text
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        ↓
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={item.content}
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    placeholder="Welcome to Huskers Rewards! 🏆

Get ready to supercharge your Husker spirit and score amazing rewards!

Earn Kernels for:
🎥 Watching Husker videos
📱 Sharing on social media
❓ Completing quizzes
📸 Uploading photos
🛍️ Making purchases
👥 Referring friends

Redeem for:
🏆 Exclusive merch
🎟️ VIP experiences
🎮 Game tickets
💰 Campus discounts
🎁 And more!

Tap the link above to sign in and start earning! The more you engage, the more you earn. 🚀

Go Big Red! 🌽❤️"
                    rows={12}
                    className="font-mono text-sm resize-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}