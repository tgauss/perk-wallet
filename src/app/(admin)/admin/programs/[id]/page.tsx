export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { canEditProgram, canViewProgram } from '@/lib/perm'
import { getAdminProgram } from '@/lib/admin-service'
import { ArrowLeft, Edit, Copy, AlertCircle, Webhook } from 'lucide-react'
import EditProgramForm from './edit-program-form'
import StatusManager from './status-manager'

interface ProgramPageProps {
  params: {
    id: string
  }
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const identity = await requireEmulatedIdentity()
  const canView = await canViewProgram(params.id)
  const canEdit = await canEditProgram(params.id)
  
  if (!canView) {
    notFound()
  }

  const program = await getAdminProgram(params.id)
  
  if (!program) {
    notFound()
  }

  // Generate webhook URL
  const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/webhooks/perk/${program.id}`

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/programs">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
          <p className="text-muted-foreground">
            Program ID: {program.perk_program_id} • Created: {new Date(program.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={
              ((program.settings as any)?.status || 'draft') === 'active' ? 'default' : 
              ((program.settings as any)?.status || 'draft') === 'draft' ? 'secondary' : 
              'outline'
            }
          >
            {((program.settings as any)?.status || 'draft')}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          {canEdit && <TabsTrigger value="edit">Edit Settings</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg">{program.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Perk Program ID</p>
                    <p className="text-lg font-mono">{program.perk_program_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{program.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{new Date(program.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet IDs */}
            <Card>
              <CardHeader>
                <CardTitle>Digital Wallet Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Apple Pass Type ID</p>
                    <p className="text-sm font-mono">
                      {program.apple_pass_type_id || <span className="text-muted-foreground">Not configured</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Google Wallet Class ID</p>
                    <p className="text-sm font-mono">
                      {program.google_wallet_class_id || <span className="text-muted-foreground">Not configured</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Management */}
            {canEdit && (
              <StatusManager program={program} />
            )}
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <div className="grid gap-6">
            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(program.branding_colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: value as string }}
                        />
                        <span className="text-sm font-mono">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(program.branding_assets).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm truncate">
                        {value || <span className="text-muted-foreground">Not set</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle>Typography & Styling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Fonts</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Header Font</p>
                        <p className="text-sm">{program.branding_fonts.header_font}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Body Font</p>
                        <p className="text-sm">{program.branding_fonts.body_font}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Border Radius</h4>
                    <div className="space-y-2">
                      {Object.entries(program.branding_borders).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm font-medium text-muted-foreground">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API & Webhooks Tab */}
        <TabsContent value="api">
          <div className="grid gap-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> API keys and webhook secrets are sensitive credentials. Never share them publicly or commit them to version control.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Credentials for connecting to the Perk API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">API Key</p>
                  <div className="flex space-x-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm">
                      {canEdit ? '••••••••••••••••••••' : 'Hidden for security'}
                    </code>
                    {canEdit && (
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Webhook className="w-5 h-5" />
                  <span>Webhook Configuration</span>
                </CardTitle>
                <CardDescription>
                  Add this webhook URL to your Perk program settings to receive real-time updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Webhook URL</p>
                  <div className="flex space-x-2">
                    <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                      {webhookUrl}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Webhook Secret</p>
                  <div className="flex space-x-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm">
                      {canEdit ? '••••••••••••••••••••' : 'Hidden for security'}
                    </code>
                    {canEdit && (
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to verify webhook signatures from Perk
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Edit Tab */}
        {canEdit && (
          <TabsContent value="edit">
            <EditProgramForm program={program} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}