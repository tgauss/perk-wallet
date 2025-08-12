'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Copy, AlertCircle, Check, Loader2, CheckCircle } from 'lucide-react'
import { createProgram } from '@/lib/admin-actions'
import { type ProgramStatus } from '@/lib/program-utils'

interface ProgramFormData {
  // Basic Info
  perk_program_id: string
  name: string
  description: string
  api_key: string
  status: ProgramStatus
  
  // Wallet IDs (optional)
  apple_pass_type_id: string
  google_wallet_class_id: string
  
  // Branding Colors
  brand_color: string
  brand_text_color: string
  secondary_color: string
  secondary_text_color: string
  body_background_color: string
  body_content_color: string
  header_background_color: string
  header_font_color: string
  hero_font_color: string
  challenge_tile_background_color: string
  reward_tile_background_color: string
  footer_background_color: string
  footer_font_color: string
  
  // Branding Assets
  favicon_url: string
  logo_url: string
  footer_logo_url: string
  overlay_image_url: string
  hero_title: string
  hero_description: string
  hero_background_image_url: string
  badge_background_image_url: string
  
  // Fonts
  header_font: string
  body_font: string
  
  // Border Radius
  button_border_radius: string
  input_border_radius: string
  tiles_border_radius: string
  cards_border_radius: string
}

const defaultColors = {
  brand_color: '#10b981',
  brand_text_color: '#ffffff',
  secondary_color: '#6b7280',
  secondary_text_color: '#ffffff',
  body_background_color: '#ffffff',
  body_content_color: '#111827',
  header_background_color: '#f9fafb',
  header_font_color: '#111827',
  hero_font_color: '#ffffff',
  challenge_tile_background_color: '#f3f4f6',
  reward_tile_background_color: '#fef3c7',
  footer_background_color: '#1f2937',
  footer_font_color: '#f9fafb'
}

const defaultBorderRadius = {
  button_border_radius: '6px',
  input_border_radius: '6px',
  tiles_border_radius: '8px',
  cards_border_radius: '12px'
}

export default function NewProgramForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState<ProgramFormData>({
    perk_program_id: '',
    name: '',
    description: '',
    api_key: '',
    status: 'draft',
    apple_pass_type_id: '',
    google_wallet_class_id: '',
    ...defaultColors,
    favicon_url: '',
    logo_url: '',
    footer_logo_url: '',
    overlay_image_url: '',
    hero_title: '',
    hero_description: '',
    hero_background_image_url: '',
    badge_background_image_url: '',
    header_font: 'Inter',
    body_font: 'Inter',
    ...defaultBorderRadius
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createProgram(formData)
      
      // Generate webhook URL
      const baseUrl = window.location.origin
      const generatedWebhookUrl = `${baseUrl}/api/webhooks/perk/${formData.perk_program_id}`
      setWebhookUrl(generatedWebhookUrl)
      setShowSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/admin/programs/${result.id}`)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program')
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ProgramFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (showSuccess && webhookUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>Program Created Successfully!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <strong>Success!</strong> Your program has been created with validated API credentials. 
              Copy the webhook URL below and add it to your Perk program settings to enable real-time sync.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label>Webhook URL for Perk</Label>
            <div className="flex space-x-2">
              <Input 
                value={webhookUrl} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add this URL to your Perk program's webhook settings to receive real-time updates.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Redirecting to program details in 3 seconds...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="wallet">Wallet IDs</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential program details and API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perk_program_id">
                    Perk Program ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="perk_program_id"
                    value={formData.perk_program_id}
                    onChange={(e) => handleInputChange('perk_program_id', e.target.value)}
                    placeholder="e.g., 12345"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The unique ID from your Perk program
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Program Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Coffee Rewards"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your loyalty program..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">
                  Perk API Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => handleInputChange('api_key', e.target.value)}
                  placeholder="Your Perk API key for this program"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This API key will be validated against the Perk API during program creation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Initial Status <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: ProgramStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span>Draft - Hidden from participants, safe for setup</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Active - Live and accepting participants</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Inactive - Paused, existing data preserved</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.status === 'draft' && 'Recommended for initial setup. Program will be hidden from participants.'}
                  {formData.status === 'active' && 'Program will be immediately available to participants with full functionality.'}
                  {formData.status === 'inactive' && 'Program will be paused. Existing participants keep their data but no new activity.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize the color scheme for your program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Primary Colors</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brand_color">Brand Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="brand_color"
                        type="color"
                        value={formData.brand_color}
                        onChange={(e) => handleInputChange('brand_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.brand_color}
                        onChange={(e) => handleInputChange('brand_color', e.target.value)}
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_text_color">Brand Text Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="brand_text_color"
                        type="color"
                        value={formData.brand_text_color}
                        onChange={(e) => handleInputChange('brand_text_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.brand_text_color}
                        onChange={(e) => handleInputChange('brand_text_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="#6b7280"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_text_color">Secondary Text Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondary_text_color"
                        type="color"
                        value={formData.secondary_text_color}
                        onChange={(e) => handleInputChange('secondary_text_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.secondary_text_color}
                        onChange={(e) => handleInputChange('secondary_text_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Layout Colors</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="body_background_color">Body Background</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="body_background_color"
                        type="color"
                        value={formData.body_background_color}
                        onChange={(e) => handleInputChange('body_background_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.body_background_color}
                        onChange={(e) => handleInputChange('body_background_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header_background_color">Header Background</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="header_background_color"
                        type="color"
                        value={formData.header_background_color}
                        onChange={(e) => handleInputChange('header_background_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.header_background_color}
                        onChange={(e) => handleInputChange('header_background_color', e.target.value)}
                        placeholder="#f9fafb"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer_background_color">Footer Background</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="footer_background_color"
                        type="color"
                        value={formData.footer_background_color}
                        onChange={(e) => handleInputChange('footer_background_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.footer_background_color}
                        onChange={(e) => handleInputChange('footer_background_color', e.target.value)}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_font_color">Hero Font Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="hero_font_color"
                        type="color"
                        value={formData.hero_font_color}
                        onChange={(e) => handleInputChange('hero_font_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.hero_font_color}
                        onChange={(e) => handleInputChange('hero_font_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="challenge_tile_background_color">Challenge Tile Background</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="challenge_tile_background_color"
                      type="color"
                      value={formData.challenge_tile_background_color}
                      onChange={(e) => handleInputChange('challenge_tile_background_color', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.challenge_tile_background_color}
                      onChange={(e) => handleInputChange('challenge_tile_background_color', e.target.value)}
                      placeholder="#f3f4f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward_tile_background_color">Reward Tile Background</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="reward_tile_background_color"
                      type="color"
                      value={formData.reward_tile_background_color}
                      onChange={(e) => handleInputChange('reward_tile_background_color', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.reward_tile_background_color}
                      onChange={(e) => handleInputChange('reward_tile_background_color', e.target.value)}
                      placeholder="#fef3c7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>
                Add logos and images for your program (use image URLs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon_url">Favicon URL</Label>
                  <Input
                    id="favicon_url"
                    type="url"
                    value={formData.favicon_url}
                    onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_logo_url">Footer Logo URL</Label>
                  <Input
                    id="footer_logo_url"
                    type="url"
                    value={formData.footer_logo_url}
                    onChange={(e) => handleInputChange('footer_logo_url', e.target.value)}
                    placeholder="https://example.com/footer-logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overlay_image_url">Overlay Image URL</Label>
                  <Input
                    id="overlay_image_url"
                    type="url"
                    value={formData.overlay_image_url}
                    onChange={(e) => handleInputChange('overlay_image_url', e.target.value)}
                    placeholder="https://example.com/overlay.png"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Hero Section</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title">Hero Title</Label>
                    <Input
                      id="hero_title"
                      value={formData.hero_title}
                      onChange={(e) => handleInputChange('hero_title', e.target.value)}
                      placeholder="Welcome to Our Rewards Program"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_background_image_url">Hero Background Image URL</Label>
                    <Input
                      id="hero_background_image_url"
                      type="url"
                      value={formData.hero_background_image_url}
                      onChange={(e) => handleInputChange('hero_background_image_url', e.target.value)}
                      placeholder="https://example.com/hero-bg.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_description">Hero Description</Label>
                  <Textarea
                    id="hero_description"
                    value={formData.hero_description}
                    onChange={(e) => handleInputChange('hero_description', e.target.value)}
                    placeholder="Earn points and unlock exclusive rewards..."
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="badge_background_image_url">Badge Background Image URL</Label>
                <Input
                  id="badge_background_image_url"
                  type="url"
                  value={formData.badge_background_image_url}
                  onChange={(e) => handleInputChange('badge_background_image_url', e.target.value)}
                  placeholder="https://example.com/badge-bg.png"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typography & Styling</CardTitle>
              <CardDescription>
                Customize fonts and border radius settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Fonts</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="header_font">Header Font</Label>
                    <Select
                      value={formData.header_font}
                      onValueChange={(value) => handleInputChange('header_font', value)}
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
                      value={formData.body_font}
                      onValueChange={(value) => handleInputChange('body_font', value)}
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

                <div className="space-y-4">
                  <h3 className="font-medium">Border Radius</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button_border_radius">Button Border Radius</Label>
                    <Input
                      id="button_border_radius"
                      value={formData.button_border_radius}
                      onChange={(e) => handleInputChange('button_border_radius', e.target.value)}
                      placeholder="6px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input_border_radius">Input Border Radius</Label>
                    <Input
                      id="input_border_radius"
                      value={formData.input_border_radius}
                      onChange={(e) => handleInputChange('input_border_radius', e.target.value)}
                      placeholder="6px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiles_border_radius">Tiles Border Radius</Label>
                    <Input
                      id="tiles_border_radius"
                      value={formData.tiles_border_radius}
                      onChange={(e) => handleInputChange('tiles_border_radius', e.target.value)}
                      placeholder="8px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cards_border_radius">Cards Border Radius</Label>
                    <Input
                      id="cards_border_radius"
                      value={formData.cards_border_radius}
                      onChange={(e) => handleInputChange('cards_border_radius', e.target.value)}
                      placeholder="12px"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet IDs */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Digital Wallet Configuration</CardTitle>
              <CardDescription>
                Optional: Configure Apple and Google Wallet integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apple_pass_type_id">Apple Pass Type ID</Label>
                <Input
                  id="apple_pass_type_id"
                  value={formData.apple_pass_type_id}
                  onChange={(e) => handleInputChange('apple_pass_type_id', e.target.value)}
                  placeholder="pass.com.yourcompany.loyalty"
                />
                <p className="text-xs text-muted-foreground">
                  Your Apple Developer Pass Type Identifier
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_wallet_class_id">Google Wallet Class ID</Label>
                <Input
                  id="google_wallet_class_id"
                  value={formData.google_wallet_class_id}
                  onChange={(e) => handleInputChange('google_wallet_class_id', e.target.value)}
                  placeholder="3388000000012345678.loyalty_class_1"
                />
                <p className="text-xs text-muted-foreground">
                  Your Google Wallet issuer class ID
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/programs')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Program...
            </>
          ) : (
            'Create Program'
          )}
        </Button>
      </div>
    </form>
  )
}