'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramBranding, BrandingColors, BrandingFonts, BrandingBorders, BrandingAssets } from '@/lib/branding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Upload } from 'lucide-react';
import { saveBrandingAction, uploadAssetAction } from './branding-actions';
import { useToast } from '@/hooks/use-toast';

interface BrandingFormProps {
  programId: string;
  branding: ProgramBranding;
}

export function BrandingForm({ programId, branding }: BrandingFormProps) {
  const [formData, setFormData] = useState<ProgramBranding>(branding);
  const [applyToNewTemplates, setApplyToNewTemplates] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  
  const handleColorChange = (field: keyof BrandingColors, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [field]: value,
      },
    }));
  };
  
  const handleFontChange = (type: 'header_font' | 'body_font', field: 'family', value: string) => {
    setFormData(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [type]: {
          ...prev.fonts[type],
          [field]: value,
        },
      },
    }));
  };
  
  const handleBorderChange = (field: keyof BrandingBorders, value: string) => {
    setFormData(prev => ({
      ...prev,
      borders: {
        ...prev.borders,
        [field]: value as any,
      },
    }));
  };
  
  const handleFileUpload = async (field: keyof BrandingAssets, file: File) => {
    try {
      const result = await uploadAssetAction(programId, file, field);
      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            [field]: result.url,
          },
        }));
        toast({
          title: "Upload successful",
          description: `${field} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const result = await saveBrandingAction(programId, formData, applyToNewTemplates);
        if (result.success) {
          toast({
            title: "Branding saved",
            description: "Your branding settings have been saved successfully.",
          });
          router.refresh();
        } else {
          toast({
            title: "Save failed",
            description: result.error || "Failed to save branding settings",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Save failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>
            Define your brand color palette
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_color">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brand_color"
                  type="color"
                  value={formData.colors.brand_color}
                  onChange={(e) => handleColorChange('brand_color', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.brand_color}
                  onChange={(e) => handleColorChange('brand_color', e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand_secondary_color">Secondary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brand_secondary_color"
                  type="color"
                  value={formData.colors.brand_secondary_color}
                  onChange={(e) => handleColorChange('brand_secondary_color', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.brand_secondary_color}
                  onChange={(e) => handleColorChange('brand_secondary_color', e.target.value)}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grad_from">Gradient From</Label>
              <div className="flex gap-2">
                <Input
                  id="grad_from"
                  type="color"
                  value={formData.colors.grad_from}
                  onChange={(e) => handleColorChange('grad_from', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.grad_from}
                  onChange={(e) => handleColorChange('grad_from', e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grad_to">Gradient To</Label>
              <div className="flex gap-2">
                <Input
                  id="grad_to"
                  type="color"
                  value={formData.colors.grad_to}
                  onChange={(e) => handleColorChange('grad_to', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.grad_to}
                  onChange={(e) => handleColorChange('grad_to', e.target.value)}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="text_primary">Primary Text</Label>
              <div className="flex gap-2">
                <Input
                  id="text_primary"
                  type="color"
                  value={formData.colors.text_primary}
                  onChange={(e) => handleColorChange('text_primary', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.text_primary}
                  onChange={(e) => handleColorChange('text_primary', e.target.value)}
                  placeholder="#0F172A"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text_secondary">Secondary Text</Label>
              <div className="flex gap-2">
                <Input
                  id="text_secondary"
                  type="color"
                  value={formData.colors.text_secondary}
                  onChange={(e) => handleColorChange('text_secondary', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.text_secondary}
                  onChange={(e) => handleColorChange('text_secondary', e.target.value)}
                  placeholder="#64748B"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text_muted">Muted Text</Label>
              <div className="flex gap-2">
                <Input
                  id="text_muted"
                  type="color"
                  value={formData.colors.text_muted}
                  onChange={(e) => handleColorChange('text_muted', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={formData.colors.text_muted}
                  onChange={(e) => handleColorChange('text_muted', e.target.value)}
                  placeholder="#94A3B8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fonts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Configure Google Fonts for headers and body text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header_font">Header Font Family</Label>
              <Input
                id="header_font"
                value={formData.fonts.header_font.family}
                onChange={(e) => handleFontChange('header_font', 'family', e.target.value)}
                placeholder="Inter"
              />
              <p className="text-xs text-muted-foreground">
                Google Font name (e.g., Inter, Roboto, Open Sans)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body_font">Body Font Family</Label>
              <Input
                id="body_font"
                value={formData.fonts.body_font.family}
                onChange={(e) => handleFontChange('body_font', 'family', e.target.value)}
                placeholder="Open Sans"
              />
              <p className="text-xs text-muted-foreground">
                Google Font name for body text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Border Radius Section */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>
            Configure corner radius for different UI elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button_radius">Button Radius</Label>
              <Select
                value={formData.borders.button_radius}
                onValueChange={(value) => handleBorderChange('button_radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="input_radius">Input Radius</Label>
              <Select
                value={formData.borders.input_radius}
                onValueChange={(value) => handleBorderChange('input_radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="card_radius">Card Radius</Label>
              <Select
                value={formData.borders.card_radius}
                onValueChange={(value) => handleBorderChange('card_radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tile_radius">Tile Radius</Label>
              <Select
                value={formData.borders.tile_radius}
                onValueChange={(value) => handleBorderChange('tile_radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Assets Section */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
          <CardDescription>
            Upload logos, images, and other brand assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'logo' as const, label: 'Primary Logo' },
            { key: 'footer_logo' as const, label: 'Footer Logo' },
            { key: 'overlay_image' as const, label: 'Overlay Image' },
            { key: 'header_background_image' as const, label: 'Header Background' },
            { key: 'badge_background_image' as const, label: 'Badge Background' },
            { key: 'favicon' as const, label: 'Favicon' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <div className="flex items-center gap-4">
                {formData.assets[key] && (
                  <img 
                    src={formData.assets[key]} 
                    alt={label}
                    className="h-12 w-12 object-cover rounded border"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(key, file);
                      }
                    }}
                    className="hidden"
                    id={`upload-${key}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(`upload-${key}`)?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.assets[key] ? 'Replace' : 'Upload'} {label}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply_to_new_templates"
              checked={applyToNewTemplates}
              onCheckedChange={(checked: boolean) => setApplyToNewTemplates(checked)}
            />
            <Label htmlFor="apply_to_new_templates">
              Apply to new templates by default
            </Label>
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="min-w-32"
        >
          {isPending ? 'Saving...' : 'Save Branding'}
        </Button>
      </div>
    </form>
  );
}