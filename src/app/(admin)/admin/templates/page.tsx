export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { canManageTemplates } from '@/lib/perm'
import { getAdminTemplates } from '@/lib/admin-service'
import { FileTemplate, Plus } from 'lucide-react'
import TemplateEditor from './template-editor'

export default async function TemplatesPage() {
  const identity = await requireEmulatedIdentity()
  const canManage = await canManageTemplates(identity.programId)
  const templates = await getAdminTemplates(identity.programId)

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
        {canManage && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <FileTemplate className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Templates Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No pass templates have been created yet. Create your first template to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileTemplate className="h-5 w-5" />
                      <span>{template.pass_type} Template</span>
                      <Badge variant="outline">v{template.version}</Badge>
                      {template.is_active && (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(template.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {canManage && (
                    <TemplateEditor template={template} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Apple Wallet</h4>
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                      {template.apple_template ? JSON.stringify(template.apple_template).slice(0, 100) + '...' : 'No template data'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Google Wallet</h4>
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                      {template.google_template ? JSON.stringify(template.google_template).slice(0, 100) + '...' : 'No template data'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}