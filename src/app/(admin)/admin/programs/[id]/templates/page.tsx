export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit, Copy, Upload } from 'lucide-react'

// Types
interface TemplateDraft {
  id: string
  pass_kind: 'loyalty' | 'rewards'
  based_on_template: string | null
  created_at: string
  updated_at: string
  version?: number
}

interface TemplateVersion {
  id: string
  version: number
}

interface TemplatesPageProps {
  params: Promise<{ id: string }>
}

// Utility function for relative time formatting
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins < 1 ? 'Just now' : `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 30) {
    return `${diffDays}d ago`
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(date)
  }
}

async function loadTemplateDrafts(programId: string): Promise<{ drafts: TemplateDraft[]; error?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Fetch template drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('template_drafts')
      .select('id, pass_kind, based_on_template, created_at, updated_at')
      .eq('program_id', programId)
      .order('pass_kind', { ascending: true })
      .order('updated_at', { ascending: false })

    if (draftsError) {
      return { drafts: [], error: `Failed to load template drafts: ${draftsError.message}` }
    }

    if (!drafts || drafts.length === 0) {
      return { drafts: [] }
    }

    // Get unique template IDs for version lookup
    const templateIds = drafts
      .map(draft => draft.based_on_template)
      .filter((id): id is string => id !== null)

    let versionMap: Record<string, number> = {}

    if (templateIds.length > 0) {
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id, version')
        .in('id', templateIds)

      if (!templatesError && templates) {
        versionMap = templates.reduce((acc, template) => {
          acc[template.id] = template.version
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Map versions into drafts
    const draftsWithVersions: TemplateDraft[] = drafts.map(draft => ({
      ...draft,
      version: draft.based_on_template ? versionMap[draft.based_on_template] : undefined
    }))

    return { drafts: draftsWithVersions }
  } catch (error) {
    return { 
      drafts: [], 
      error: error instanceof Error ? error.message : 'Unknown error loading template drafts'
    }
  }
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { id: programId } = await params
  
  if (!programId) {
    notFound()
  }

  const { drafts, error } = await loadTemplateDrafts(programId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">
          Manage wallet pass template drafts for this program
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pass Templates (Drafts)</CardTitle>
          <CardDescription>
            Design and publish wallet pass templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No drafts yet</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled variant="outline">
                      Create from seed
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Already seeded - use existing drafts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pass Kind</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Based On</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Updated</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge 
                          variant={draft.pass_kind === 'loyalty' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {draft.pass_kind}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {draft.version ? `v${draft.version}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatRelativeTime(draft.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/admin/programs/${programId}/templates/${draft.id}`}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Duplicate
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Coming soon</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Publish
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Open draft to publish</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test path comment */}
      {/* Test URL: /admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd/templates */}
    </div>
  )
}