'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Upload, 
  Plus, 
  X, 
  AlertCircle,
  Smartphone,
  CreditCard,
  Settings2,
  Eye,
  EyeOff,
  HelpCircle,
  Save,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { UploadZone } from './components/upload-zone'
import { FieldEditor } from './components/field-editor'
import { ColorPicker } from './components/color-picker'
import { PassPreview } from './components/pass-preview'

interface TemplateDesignerProps {
  programId: string
  draftId: string
}

export function TemplateDesigner({ programId, draftId }: TemplateDesignerProps) {
  const [activeTab, setActiveTab] = useState('front')
  const [previewDevice, setPreviewDevice] = useState<'ios' | 'android'>('ios')
  const [showGrid, setShowGrid] = useState(false)
  
  // Form state
  const [design, setDesign] = useState({
    logo: null as File | null,
    icon: null as File | null,
    backgroundColor: '#D00000',
    labelColor: '#FFFFFF',
    valueColor: '#FFFFFF',
    coverImage: null as File | null,
    logoText: 'Fan Club',
    topField: {
      label: 'Title',
      value: '{program_name}'
    },
    fields: [
      { id: '1', label: 'Name', value: '{full_name}' },
      { id: '2', label: 'Status', value: '{tier}' }
    ],
    barcode: {
      type: 'QR Code',
      data: '{perk_id}',
      caption: '{perk_id}'
    }
  })

  const handleFileUpload = useCallback((field: 'logo' | 'icon' | 'coverImage', file: File) => {
    // Validate file
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or SVG file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setDesign(prev => ({ ...prev, [field]: file }))
    toast.success(`${field} uploaded successfully`)
  }, [])

  const addField = useCallback(() => {
    const newField = {
      id: String(Date.now()),
      label: 'Field Label',
      value: ''
    }
    setDesign(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }, [])

  const removeField = useCallback((id: string) => {
    setDesign(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }))
  }, [])

  const updateField = useCallback((id: string, updates: Partial<{ label: string; value: string }>) => {
    setDesign(prev => ({
      ...prev,
      fields: prev.fields.map(f => 
        f.id === id ? { ...f, ...updates } : f
      )
    }))
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Form */}
      <div className="flex-1 bg-white border-r overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none h-12 bg-gray-100">
              <TabsTrigger value="front" className="data-[state=active]:bg-white">
                Front of Pass
              </TabsTrigger>
              <TabsTrigger value="back" className="data-[state=active]:bg-white">
                Back of Pass
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-white">
                Features
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6">
          <TabsContent value="front" className="mt-0 space-y-6">
            {/* Design Section */}
            <div>
              <h2 className="text-lg font-semibold mb-1">Design</h2>
              <p className="text-sm text-gray-600 mb-4">Customize the design of your pass</p>

              {/* Logo Upload */}
              <div className="space-y-4">
                <UploadZone
                  label="Logo (required)"
                  description="The main logo shown on the pass"
                  dimensions="PNG, SVG, JPG (recommended 480x150px or narrower)"
                  value={design.logo}
                  onChange={(file) => setDesign(prev => ({ ...prev, logo: file }))}
                />

                {/* Icon */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Icon
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">HUSKERS</span>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                    <span className="text-sm text-gray-500">Generated from your logo</span>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-3 gap-4">
                  <ColorPicker
                    label="Background color"
                    value={design.backgroundColor}
                    onChange={(value) => setDesign(prev => ({ ...prev, backgroundColor: value }))}
                  />
                  <ColorPicker
                    label="Label color"
                    value={design.labelColor}
                    onChange={(value) => setDesign(prev => ({ ...prev, labelColor: value }))}
                  />
                  <ColorPicker
                    label="Value color"
                    value={design.valueColor}
                    onChange={(value) => setDesign(prev => ({ ...prev, valueColor: value }))}
                  />
                </div>

                {/* Cover Image */}
                <UploadZone
                  label="Cover Image"
                  description="Optional banner image shown at the top of the pass"
                  dimensions="PNG, SVG, JPG (recommended 1125x432px)"
                  value={design.coverImage}
                  onChange={(file) => setDesign(prev => ({ ...prev, coverImage: file }))}
                />

                {/* Google Wallet Cover Override */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Google Wallet Cover Image Override
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Optionally add an image that will replace the standard cover image in Google Wallet. 
                    (Animated formats are supported)
                  </p>
                  <Button variant="outline" size="sm">Add</Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Front Fields Section */}
            <div>
              <h2 className="text-lg font-semibold mb-1">Front Fields</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add information you want your users to see on the front of this pass
              </p>

              {/* Logo Text */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FieldEditor
                  label="Logo Text"
                  value={design.logoText}
                  onChange={(value) => setDesign(prev => ({ ...prev, logoText: value }))}
                  placeholder="Fan Club"
                  showMergeTags={false}
                />
                <FieldEditor
                  label="Top Field"
                  value={design.topField.value}
                  onChange={(value) => setDesign(prev => ({ 
                    ...prev, 
                    topField: { ...prev.topField, value }
                  }))}
                  placeholder="Title"
                />
              </div>

              {/* Dynamic Fields */}
              {design.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-4 mb-4">
                  <FieldEditor
                    label={`Field ${index + 1} Label`}
                    value={field.label}
                    onChange={(value) => updateField(field.id, { label: value })}
                    placeholder="Label"
                    showMergeTags={false}
                    removable
                    onRemove={() => removeField(field.id)}
                  />
                  <FieldEditor
                    label={`Field ${index + 1} Value`}
                    value={field.value}
                    onChange={(value) => updateField(field.id, { value })}
                    placeholder="Value or {merge_tag}"
                  />
                </div>
              ))}

              <Button 
                variant="outline" 
                size="sm"
                onClick={addField}
                className="mt-2"
              >
                Add Field
              </Button>
            </div>

            <Separator />

            {/* Barcode Section */}
            <div>
              <h2 className="text-lg font-semibold mb-1">Barcode</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add a barcode that can be scanned. If you want this to be a QR code that links to a webpage,
                enter a URL in the data field.
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Select a Barcode Type</Label>
                  <Select 
                    value={design.barcode.type}
                    onValueChange={(value) => setDesign(prev => ({
                      ...prev,
                      barcode: { ...prev.barcode, type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QR Code">QR Code</SelectItem>
                      <SelectItem value="PDF417">PDF417</SelectItem>
                      <SelectItem value="Aztec">Aztec</SelectItem>
                      <SelectItem value="Code 128">Code 128</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FieldEditor
                  label="Data"
                  value={design.barcode.data}
                  onChange={(value) => setDesign(prev => ({
                    ...prev,
                    barcode: { ...prev.barcode, data: value }
                  }))}
                  placeholder="{perk_id} or URL"
                />

                <FieldEditor
                  label="Caption"
                  value={design.barcode.caption}
                  onChange={(value) => setDesign(prev => ({
                    ...prev,
                    barcode: { ...prev.barcode, caption: value }
                  }))}
                  placeholder="Text shown below barcode"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="back" className="mt-0 space-y-6">
            {/* Back Fields Section */}
            <div>
              <h2 className="text-lg font-semibold mb-1">Back Fields</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add additional information displayed on the back of the pass
              </p>

              <div className="space-y-4">
                <FieldEditor
                  label="Terms & Conditions"
                  value=""
                  onChange={() => {}}
                  placeholder="Enter terms or link"
                />
                <FieldEditor
                  label="Customer Service"
                  value="support@example.com"
                  onChange={() => {}}
                  placeholder="Email or phone number"
                />
                <FieldEditor
                  label="Website"
                  value="https://example.com"
                  onChange={() => {}}
                  placeholder="Your website URL"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-0 space-y-6">
            {/* Features Section */}
            <div>
              <h2 className="text-lg font-semibold mb-1">Push Notifications</h2>
              <p className="text-sm text-gray-600 mb-4">
                Send updates when pass data changes
              </p>
              
              <div className="flex items-center space-x-2">
                <Switch id="push-enabled" />
                <Label htmlFor="push-enabled">Enable push notifications</Label>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-1">Location Triggers</h2>
              <p className="text-sm text-gray-600 mb-4">
                Show pass on lock screen when near specified locations
              </p>
              
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-1">Pass Sharing</h2>
              <p className="text-sm text-gray-600 mb-4">
                Allow users to share their pass
              </p>
              
              <div className="flex items-center space-x-2">
                <Switch id="sharing-enabled" />
                <Label htmlFor="sharing-enabled">Enable pass sharing</Label>
              </div>
            </div>
          </TabsContent>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-96 bg-gray-100 p-6 overflow-y-auto">
        <div className="sticky top-0 bg-gray-100 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={previewDevice === 'ios' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setPreviewDevice('ios')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === 'android' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setPreviewDevice('android')}
              >
                <CreditCard className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGrid(!showGrid)}
              >
                {showGrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <Button className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>

        {/* Pass Preview */}
        <PassPreview
          device={previewDevice}
          design={design}
          className="mx-auto"
        />
      </div>
    </div>
  )
}