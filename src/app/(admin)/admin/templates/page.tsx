'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileTemplate, Plus, Save, RotateCcw } from 'lucide-react'

const mockTemplates = [
  {
    id: '1',
    program_id: '1',
    pass_type: 'loyalty',
    version: 3,
    is_active: true,
    created_at: '2024-01-15',
    apple_template: {
      passTypeIdentifier: 'pass.com.example.loyalty',
      teamIdentifier: 'ABCD1234',
      organizationName: 'Coffee Rewards'
    },
    google_template: {
      classId: 'com.example.loyalty.coffee'
    }
  }
]

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(mockTemplates[0])
  const [isEditing, setIsEditing] = useState(false)
  const [appleJson, setAppleJson] = useState(() => 
    JSON.stringify(selectedTemplate.apple_template, null, 2)
  )
  const [googleJson, setGoogleJson] = useState(() => 
    JSON.stringify(selectedTemplate.google_template, null, 2)
  )

  const handleBumpVersion = async () => {
    console.log('Bump template version')
  }

  const handleSave = async () => {
    console.log('Save template changes')
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage pass templates and layouts for your program
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Templates List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockTemplates.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {template.pass_type} v{template.version}
                  </div>
                  {template.is_active && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Template Editor</CardTitle>
                <CardDescription>
                  {selectedTemplate.pass_type} template v{selectedTemplate.version}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleBumpVersion}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Bump Version
                </Button>
                {isEditing ? (
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="apple">
              <TabsList>
                <TabsTrigger value="apple">Apple Template</TabsTrigger>
                <TabsTrigger value="google">Google Template</TabsTrigger>
              </TabsList>
              
              <TabsContent value="apple" className="space-y-4">
                <div className="space-y-2">
                  <Label>Apple Wallet Template JSON</Label>
                  <Textarea
                    value={appleJson}
                    onChange={(e) => setAppleJson(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    disabled={!isEditing}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="google" className="space-y-4">
                <div className="space-y-2">
                  <Label>Google Wallet Template JSON</Label>
                  <Textarea
                    value={googleJson}
                    onChange={(e) => setGoogleJson(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    disabled={!isEditing}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}