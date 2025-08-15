'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Tag, User, Building, Hash, Zap } from 'lucide-react'
import { SUPPORTED_TAGS } from '@/lib/mergeTags'

interface MergeTagPaletteProps {
  programId: string
  onTagSelect: (tag: string) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

interface TagCategory {
  name: string
  icon: any
  description: string
  tags: { key: string; description: string; example: string }[]
}

export function MergeTagPalette({ 
  programId, 
  onTagSelect, 
  isOpen = true, 
  onOpenChange 
}: MergeTagPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Sample participant data for examples
  const sampleData = {
    points: '1,250',
    unused_points: '750',
    tier: 'Gold',
    status: 'Active',
    email: 'john.doe@example.com',
    fname: 'John',
    lname: 'Doe',
    full_name: 'John Doe',
    program_name: 'VIP Rewards',
    'profile.favorite_color': 'Blue',
    'profile.birthday': '1990-01-15',
    'profile.city': 'San Francisco',
    points_delta: '+50',
    new_points: '1,300'
  }

  const tagCategories: TagCategory[] = useMemo(() => [
    {
      name: 'Participant Info',
      icon: User,
      description: 'Basic participant information',
      tags: [
        { key: 'fname', description: 'First name', example: sampleData.fname },
        { key: 'lname', description: 'Last name', example: sampleData.lname },
        { key: 'full_name', description: 'Full name (first + last)', example: sampleData.full_name },
        { key: 'email', description: 'Email address', example: sampleData.email },
      ]
    },
    {
      name: 'Points & Status',
      icon: Hash,
      description: 'Points balance and participant status',
      tags: [
        { key: 'points', description: 'Total points balance', example: sampleData.points },
        { key: 'unused_points', description: 'Available points for redemption', example: sampleData.unused_points },
        { key: 'tier', description: 'Current tier level', example: sampleData.tier },
        { key: 'status', description: 'Participant status', example: sampleData.status },
      ]
    },
    {
      name: 'Program Info',
      icon: Building,
      description: 'Program-level information',
      tags: [
        { key: 'program_name', description: 'Program display name', example: sampleData.program_name },
      ]
    },
    {
      name: 'Profile Attributes',
      icon: Tag,
      description: 'Custom profile data (use profile.* syntax)',
      tags: [
        { key: 'profile.favorite_color', description: 'Custom attribute example', example: sampleData['profile.favorite_color'] },
        { key: 'profile.birthday', description: 'Custom attribute example', example: sampleData['profile.birthday'] },
        { key: 'profile.city', description: 'Custom attribute example', example: sampleData['profile.city'] },
      ]
    },
    {
      name: 'Event-Specific',
      icon: Zap,
      description: 'Available in notifications only',
      tags: [
        { key: 'points_delta', description: 'Points change amount', example: sampleData.points_delta },
        { key: 'new_points', description: 'New balance after change', example: sampleData.new_points },
      ]
    }
  ], [])

  // Filter tags based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return tagCategories

    return tagCategories.map(category => ({
      ...category,
      tags: category.tags.filter(tag => 
        tag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.tags.length > 0)
  }, [tagCategories, searchQuery])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Tag className="w-5 h-5" />
          <span>Merge Tag Catalog</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 overflow-y-auto max-h-96">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No tags found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <div className="flex items-center space-x-2">
                <category.icon className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">{category.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{category.description}</p>
              
              <div className="space-y-2">
                {category.tags.map((tag) => (
                  <div
                    key={tag.key}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => onTagSelect(tag.key)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {`{${tag.key}}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {tag.description}
                      </p>
                    </div>
                    <div className="text-right min-w-0 ml-2">
                      <p className="text-xs font-medium text-primary truncate">
                        {tag.example}
                      </p>
                      <p className="text-xs text-muted-foreground">example</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {category !== filteredCategories[filteredCategories.length - 1] && (
                <Separator className="my-4" />
              )}
            </div>
          ))
        )}

        {/* Quick Help */}
        <div className="mt-6 p-3 bg-muted rounded-lg">
          <h5 className="text-sm font-medium mb-2">Quick Help</h5>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• Click any tag above to insert it</p>
            <p>• Use profile.* for custom attributes</p>
            <p>• Unknown tags will show warnings</p>
            <p>• Tags are case-sensitive</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}