'use client';

import { ProgramBranding } from '@/lib/branding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BrandingPreviewProps {
  branding: ProgramBranding;
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  const { colors, fonts, assets, header_content } = branding;
  
  return (
    <div className="space-y-6">
      {/* Header Preview with Gradient */}
      <Card className="overflow-hidden">
        <div 
          className="relative h-48 flex items-center justify-center text-white"
          style={{
            background: `linear-gradient(135deg, ${colors.grad_from}, ${colors.grad_to})`,
          }}
        >
          {assets.header_background_image && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${assets.header_background_image})` }}
            />
          )}
          <div className="relative text-center space-y-2 px-6">
            {assets.logo && (
              <img 
                src={assets.logo} 
                alt="Program Logo" 
                className="h-12 mx-auto mb-4 object-contain"
              />
            )}
            <h1 
              className="text-3xl font-bold"
              style={{ fontFamily: `"${fonts.header_font.family}", sans-serif` }}
            >
              {header_content.header_text}
            </h1>
            <p 
              className="text-lg opacity-90"
              style={{ fontFamily: `"${fonts.body_font.family}", sans-serif` }}
            >
              {header_content.header_description}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Component Previews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">UI Components Preview</h3>
        
        {/* Buttons Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Preview of button styles with your brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                style={{
                  backgroundColor: colors.brand_color,
                  color: '#FFFFFF',
                }}
              >
                Primary Button
              </Button>
              <Button 
                variant="secondary"
                style={{
                  backgroundColor: colors.brand_secondary_color,
                  color: '#FFFFFF',
                }}
              >
                Secondary Button
              </Button>
              <Button variant="outline">
                Outline Button
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Cards Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Cards & Content</CardTitle>
            <CardDescription>Preview of card layouts and content areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card 
              className="p-4"
              style={{
                backgroundColor: colors.background_secondary,
                borderColor: colors.brand_color,
              }}
            >
              <h4 
                className="font-semibold mb-2"
                style={{ 
                  color: colors.text_primary,
                  fontFamily: `"${fonts.header_font.family}", sans-serif`
                }}
              >
                Sample Card Title
              </h4>
              <p 
                style={{ 
                  color: colors.text_secondary,
                  fontFamily: `"${fonts.body_font.family}", sans-serif`
                }}
              >
                This is how your content will look with the selected fonts and colors.
              </p>
              <div className="mt-3 flex gap-2">
                <Badge style={{ backgroundColor: colors.brand_color, color: '#FFFFFF' }}>
                  Primary Tag
                </Badge>
                <Badge variant="secondary">
                  Secondary Tag
                </Badge>
              </div>
            </Card>
          </CardContent>
        </Card>
        
        {/* Form Elements Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Preview of input fields and form components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label 
                className="text-sm font-medium"
                style={{ color: colors.text_primary }}
              >
                Sample Input Field
              </label>
              <Input 
                placeholder="Enter your text here..."
                style={{
                  backgroundColor: colors.background_primary,
                  borderColor: colors.brand_color,
                  color: colors.text_primary,
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Typography Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Preview of font families and text styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  color: colors.text_primary,
                  fontFamily: `"${fonts.header_font.family}", sans-serif`
                }}
              >
                Header Font: {fonts.header_font.family}
              </h1>
              <p 
                style={{ 
                  color: colors.text_secondary,
                  fontFamily: `"${fonts.body_font.family}", sans-serif`
                }}
              >
                Body Font: {fonts.body_font.family} - This is how your regular text will appear throughout the application with the selected body font family.
              </p>
              <p 
                className="text-sm"
                style={{ color: colors.text_muted }}
              >
                Muted text in the selected color scheme.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}