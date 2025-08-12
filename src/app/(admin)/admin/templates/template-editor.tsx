'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Edit, RotateCcw, Save } from 'lucide-react'
import { bumpTemplateVersion } from '@/lib/admin-service'
import type { Database } from '@/lib/supabase'

type Template = Database['public']['Tables']['templates']['Row']

interface TemplateEditorProps {
  template: Template
}

export default function TemplateEditor({ template }: TemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isBumping, setIsBumping] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(template.version)
  const [appleJson, setAppleJson] = useState(
    JSON.stringify(template.apple_template, null, 2)
  )
  const [googleJson, setGoogleJson] = useState(
    JSON.stringify(template.google_template, null, 2)
  )

  const handleBumpVersion = async () => {
    try {
      setIsBumping(true)
      const newVersion = await bumpTemplateVersion(template.id)
      setCurrentVersion(newVersion)
    } catch (error) {
      console.error('Error bumping template version:', error)
    } finally {
      setIsBumping(false)
    }
  }

  const handleSave = async () => {
    try {
      // Parse JSON to validate
      JSON.parse(appleJson)
      JSON.parse(googleJson)
      
      // TODO: Implement template update API
      console.log('Save template changes')
      setIsEditing(false)
    } catch (error) {
      console.error('Invalid JSON:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Template Editor</span>
            <Badge variant="outline">v{currentVersion}</Badge>
            {template.is_active && (
              <Badge variant="secondary">Active</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {template.pass_type} template for program
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={handleBumpVersion}
              disabled={isBumping}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isBumping ? 'Bumping...' : 'Bump Version'}
            </Button>
            {isEditing ? (
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Templates
              </Button>
            )}
          </div>

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
                  rows={20}
                  className="font-mono text-sm"
                  disabled={!isEditing}
                  placeholder="Enter Apple Wallet template JSON..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="google" className="space-y-4">
              <div className="space-y-2">
                <Label>Google Wallet Template JSON</Label>
                <Textarea
                  value={googleJson}
                  onChange={(e) => setGoogleJson(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  disabled={!isEditing}
                  placeholder="Enter Google Wallet template JSON..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}