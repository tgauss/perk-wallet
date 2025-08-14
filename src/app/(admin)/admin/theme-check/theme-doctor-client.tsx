'use client';

import { useEffect, useState } from 'react';
import { useProgramTokens } from '@/components/branding/program-theme-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface CSSVariable {
  name: string;
  value: string;
  expected?: string;
  status: 'ok' | 'warning' | 'error';
}

interface FontCheck {
  family: string;
  loaded: boolean;
  usage: 'header' | 'body';
}

export function ThemeDoctorClient() {
  const [cssVariables, setCssVariables] = useState<CSSVariable[]>([]);
  const [fontChecks, setFontChecks] = useState<FontCheck[]>([]);
  const [googleFontsLinks, setGoogleFontsLinks] = useState<string[]>([]);
  
  const tokens = useProgramTokens();
  
  useEffect(() => {
    // Check CSS variables
    const checkCSSVariables = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const variables: CSSVariable[] = [
        {
          name: '--primary',
          value: computedStyle.getPropertyValue('--primary').trim(),
          status: 'ok',
        },
        {
          name: '--primary-foreground',
          value: computedStyle.getPropertyValue('--primary-foreground').trim(),
          status: 'ok',
        },
        {
          name: '--secondary',
          value: computedStyle.getPropertyValue('--secondary').trim(),
          status: 'ok',
        },
        {
          name: '--background',
          value: computedStyle.getPropertyValue('--background').trim(),
          status: 'ok',
        },
        {
          name: '--foreground',
          value: computedStyle.getPropertyValue('--foreground').trim(),
          status: 'ok',
        },
        {
          name: '--card',
          value: computedStyle.getPropertyValue('--card').trim(),
          status: 'ok',
        },
        {
          name: '--muted',
          value: computedStyle.getPropertyValue('--muted').trim(),
          status: 'ok',
        },
        {
          name: '--radius',
          value: computedStyle.getPropertyValue('--radius').trim(),
          status: 'ok',
        },
        {
          name: '--header-font',
          value: computedStyle.getPropertyValue('--header-font').trim(),
          expected: `"${tokens.fonts.header_font.family}", sans-serif`,
          status: 'ok',
        },
        {
          name: '--body-font',
          value: computedStyle.getPropertyValue('--body-font').trim(),
          expected: `"${tokens.fonts.body_font.family}", sans-serif`,
          status: 'ok',
        },
      ];
      
      // Check if variables have values
      variables.forEach(variable => {
        if (!variable.value) {
          variable.status = 'error';
        } else if (variable.expected && variable.value !== variable.expected) {
          variable.status = 'warning';
        }
      });
      
      setCssVariables(variables);
    };
    
    // Check Google Fonts
    const checkGoogleFonts = () => {
      const links = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
        .map(link => (link as HTMLLinkElement).href);
      setGoogleFontsLinks(links);
      
      // Check if fonts are loaded using document.fonts API
      const fontChecks: FontCheck[] = [
        {
          family: tokens.fonts.header_font.family,
          loaded: document.fonts.check(`16px "${tokens.fonts.header_font.family}"`),
          usage: 'header',
        },
        {
          family: tokens.fonts.body_font.family,
          loaded: document.fonts.check(`16px "${tokens.fonts.body_font.family}"`),
          usage: 'body',
        },
      ];
      
      setFontChecks(fontChecks);
    };
    
    checkCSSVariables();
    checkGoogleFonts();
    
    // Recheck fonts after a delay to allow loading
    const fontTimeout = setTimeout(() => {
      checkGoogleFonts();
    }, 2000);
    
    return () => clearTimeout(fontTimeout);
  }, [tokens]);
  
  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const okCount = cssVariables.filter(v => v.status === 'ok').length;
  const warningCount = cssVariables.filter(v => v.status === 'warning').length;
  const errorCount = cssVariables.filter(v => v.status === 'error').length;
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Status Summary</CardTitle>
          <CardDescription>
            Overall health of the theme system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Badge variant="outline" className="text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {okCount} OK
            </Badge>
            {warningCount > 0 && (
              <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {warningCount} Warnings
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                {errorCount} Errors
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* CSS Variables */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Variables</CardTitle>
          <CardDescription>
            Current values of theme CSS variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cssVariables.map((variable) => (
              <div key={variable.name} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(variable.status)}
                  <code className="text-sm font-mono">{variable.name}</code>
                </div>
                <div className="text-right">
                  <code className="text-sm text-muted-foreground">
                    {variable.value || 'Not set'}
                  </code>
                  {variable.expected && variable.value !== variable.expected && (
                    <div className="text-xs text-muted-foreground">
                      Expected: {variable.expected}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Google Fonts */}
      <Card>
        <CardHeader>
          <CardTitle>Google Fonts</CardTitle>
          <CardDescription>
            Font loading status and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Font Links</h4>
            {googleFontsLinks.length > 0 ? (
              <div className="space-y-1">
                {googleFontsLinks.map((link, index) => (
                  <div key={index} className="text-sm">
                    <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                    <code className="text-xs">{link}</code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <XCircle className="h-3 w-3 inline mr-1 text-red-500" />
                No Google Fonts links found
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Font Loading Status</h4>
            <div className="space-y-1">
              {fontChecks.map((font) => (
                <div key={`${font.family}-${font.usage}`} className="flex items-center gap-2 text-sm">
                  {font.loaded ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span>{font.family}</span>
                  <Badge variant="outline" className="text-xs">
                    {font.usage}
                  </Badge>
                  <span className="text-muted-foreground">
                    {font.loaded ? 'Loaded' : 'Not loaded'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Component Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Component Visual Tests</CardTitle>
          <CardDescription>
            Visual confirmation of themed components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div>
            <h4 className="font-medium mb-3">Buttons</h4>
            <div className="flex flex-wrap gap-2">
              <Button className="font-header">Primary Button</Button>
              <Button variant="secondary" className="font-header">Secondary Button</Button>
              <Button variant="outline" className="font-body">Outline Button</Button>
              <Button variant="ghost" className="font-body">Ghost Button</Button>
            </div>
          </div>
          
          {/* Cards */}
          <div>
            <h4 className="font-medium mb-3">Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-header">Sample Card</CardTitle>
                  <CardDescription className="font-body">
                    This card uses themed colors and fonts
                  </CardDescription>
                </CardHeader>
                <CardContent className="font-body">
                  <p>Content area with body font styling.</p>
                </CardContent>
              </Card>
              
              <Card className="themed-card">
                <CardHeader>
                  <CardTitle className="font-header">Themed Card</CardTitle>
                  <CardDescription className="font-body">
                    This card explicitly uses theme CSS classes
                  </CardDescription>
                </CardHeader>
                <CardContent className="font-body">
                  <p>Content with explicit theme styling.</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Inputs */}
          <div>
            <h4 className="font-medium mb-3">Form Elements</h4>
            <div className="space-y-3 max-w-md">
              <Input 
                placeholder="Standard input field" 
                className="font-body"
              />
              <Input 
                placeholder="Themed input field" 
                className="themed-input font-body"
              />
            </div>
          </div>
          
          {/* Typography */}
          <div>
            <h4 className="font-medium mb-3">Typography</h4>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-header">
                Header Font Sample (H1)
              </h1>
              <h2 className="text-2xl font-semibold font-header">
                Header Font Sample (H2)
              </h2>
              <p className="font-body">
                Body font sample - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Muted text with body font styling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Raw Token Values */}
      <Card>
        <CardHeader>
          <CardTitle>Current Theme Tokens</CardTitle>
          <CardDescription>
            Raw values from the program theme context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Colors</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(tokens.colors, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Fonts</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(tokens.fonts, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Borders</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(tokens.borders, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Assets</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(tokens.assets, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}