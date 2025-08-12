'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Save, Loader2 } from 'lucide-react'
import { updateProgram } from '@/lib/admin-actions'
import type { Database } from '@/lib/supabase'

type Program = Database['public']['Tables']['programs']['Row']

interface EditProgramFormProps {
  program: Program
}

export default function EditProgramForm({ program }: EditProgramFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: program.name,
    description: program.description || '',
    api_key: program.api_key,
    
    // Wallet IDs
    apple_pass_type_id: program.apple_pass_type_id || '',
    google_wallet_class_id: program.google_wallet_class_id || '',
    
    // Branding
    branding_colors: program.branding_colors,
    branding_assets: program.branding_assets,
    branding_fonts: program.branding_fonts,
    branding_borders: program.branding_borders
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await updateProgram(program.id, {
        name: formData.name,
        description: formData.description || null,
        api_key: formData.api_key,
        apple_pass_type_id: formData.apple_pass_type_id || null,
        google_wallet_class_id: formData.google_wallet_class_id || null,
        branding_colors: formData.branding_colors,
        branding_assets: formData.branding_assets,
        branding_fonts: formData.branding_fonts,
        branding_borders: formData.branding_borders
      })
      
      setSuccessMessage('Program settings updated successfully!')
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update program')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleColorChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      branding_colors: {
        ...prev.branding_colors,
        [key]: value
      }
    }))
  }

  const handleAssetChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      branding_assets: {
        ...prev.branding_assets,
        [key]: value || undefined
      }
    }))
  }

  const handleFontChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      branding_fonts: {
        ...prev.branding_fonts,
        [key]: value
      }
    }))
  }

  const handleBorderChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      branding_borders: {
        ...prev.branding_borders,
        [key]: value
      }
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update program name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Program Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Update Perk API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">Perk API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Enter new API key or leave unchanged"
            />
            <p className="text-xs text-muted-foreground">
              Only update if you need to change the API key
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Digital Wallet Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Wallet Configuration</CardTitle>
          <CardDescription>
            Configure Apple and Google Wallet integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apple_pass_type_id">Apple Pass Type ID</Label>
            <Input
              id="apple_pass_type_id"
              value={formData.apple_pass_type_id}
              onChange={(e) => setFormData(prev => ({ ...prev, apple_pass_type_id: e.target.value }))}
              placeholder="pass.com.yourcompany.loyalty"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_wallet_class_id">Google Wallet Class ID</Label>
            <Input
              id="google_wallet_class_id"
              value={formData.google_wallet_class_id}
              onChange={(e) => setFormData(prev => ({ ...prev, google_wallet_class_id: e.target.value }))}
              placeholder="3388000000012345678.loyalty_class_1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Customize the color scheme for your program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.branding_colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`color-${key}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id={`color-${key}`}
                    type="color"
                    value={value as string}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-20"
                  />
                  <Input
                    value={value as string}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
          <CardDescription>
            Update logos and images (use image URLs)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(formData.branding_assets).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`asset-${key}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                {key.includes('description') || key === 'hero_title' ? (
                  <Textarea
                    id={`asset-${key}`}
                    value={(value as string) || ''}
                    onChange={(e) => handleAssetChange(key, e.target.value)}
                    rows={2}
                  />
                ) : (
                  <Input
                    id={`asset-${key}`}
                    type="url"
                    value={(value as string) || ''}
                    onChange={(e) => handleAssetChange(key, e.target.value)}
                    placeholder="https://example.com/image.png"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Configure fonts for your program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header_font">Header Font</Label>
              <Select
                value={formData.branding_fonts.header_font}
                onValueChange={(value) => handleFontChange('header_font', value)}
              >
                <SelectTrigger id="header_font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_font">Body Font</Label>
              <Select
                value={formData.branding_fonts.body_font}
                onValueChange={(value) => handleFontChange('body_font', value)}
              >
                <SelectTrigger id="body_font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                  <SelectItem value="Nunito">Nunito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>
            Configure border radius for UI elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.branding_borders).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`border-${key}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <Input
                  id={`border-${key}`}
                  value={value}
                  onChange={(e) => handleBorderChange(key, e.target.value)}
                  placeholder="6px"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}