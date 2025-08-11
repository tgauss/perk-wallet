'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Eye, EyeOff, Save, AlertCircle } from 'lucide-react'

// Mock program data - in real app this would come from Supabase
const getProgramData = (id: string) => ({
  id,
  name: 'Coffee Rewards',
  program_id: 'coffee-123',
  description: 'Loyalty program for coffee shop chain',
  status: 'active',
  created_at: '2024-01-15',
  perk_api_key: 'pk_live_abc123def456ghi789',
  branding: {
    fonts: {
      header_font: 'Inter',
      body_font: 'Inter'
    },
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#F59E0B'
    },
    assets: {
      logo: 'https://example.com/logo.png',
      background: 'https://example.com/bg.jpg'
    },
    borders: {
      button_border_radius: 'Medium',
      input_border_radius: 'Medium',
      tiles_border_radius: 'Medium',
      cards_border_radius: 'Medium'
    }
  }
})

export default function ProgramDetailPage() {
  const params = useParams()
  const programId = params.id as string
  
  const [program] = useState(() => getProgramData(programId))
  const [brandingJson, setBrandingJson] = useState(() => 
    JSON.stringify(program.branding, null, 2)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSaveBranding = async () => {
    setIsSaving(true)
    setError('')

    try {
      // Validate JSON
      const parsed = JSON.parse(brandingJson)
      
      // In real app, this would call server action
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsEditing(false)
      console.log('Saved branding:', parsed)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.')
      } else {
        setError('Failed to save branding configuration.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyApiKey = async () => {
    // In real app, this would be a server action that copies the key server-side
    // and just shows a toast notification
    try {
      await navigator.clipboard.writeText(program.perk_api_key)
      // Show toast notification
      console.log('API key copied to clipboard')
    } catch (err) {
      console.error('Failed to copy API key:', err)
    }
  }

  const handleCancelEdit = () => {
    setBrandingJson(JSON.stringify(program.branding, null, 2))
    setIsEditing(false)
    setError('')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
          <Badge variant="secondary">{program.status}</Badge>
        </div>
        <p className="text-muted-foreground">{program.description}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Program ID: {program.program_id}</span>
          <span>•</span>
          <span>Created: {new Date(program.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Program Configuration */}
      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Brand Configuration</CardTitle>
                  <CardDescription>
                    Customize fonts, colors, assets, and visual styling for your program
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Branding
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBranding} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="branding-json">Branding JSON</Label>
                <Textarea
                  id="branding-json"
                  value={brandingJson}
                  onChange={(e) => setBrandingJson(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  disabled={!isEditing}
                  placeholder="Enter branding configuration as JSON..."
                />
                {!isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Click "Edit Branding" to modify the configuration
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>
                Basic program configuration and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Program Name</Label>
                  <p className="text-sm text-muted-foreground">{program.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Program ID</Label>
                  <p className="text-sm text-muted-foreground">{program.program_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary">{program.status}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(program.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Configuration Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                API keys and webhook settings for your program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Perk API Key</Label>
                <div className="flex space-x-2">
                  <div className="flex-1 font-mono text-sm p-2 bg-muted rounded-md">
                    {showApiKey ? program.perk_api_key : '••••••••••••••••••••••••'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyApiKey}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This API key is used to authenticate with the Perk API. Keep it secure.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> API keys are redacted in the admin interface. 
                  Use the "Copy" button to copy the full key to your clipboard server-side.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}