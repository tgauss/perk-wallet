export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EditorClient } from './editor-client'

// Types
interface TemplateDraft {
  id: string
  program_id: string
  pass_kind: 'loyalty' | 'rewards'
  based_on_template: string | null
  layout: Record<string, any>
  assets: Record<string, any>
  updated_at: string
}

interface TemplateEditorPageProps {
  params: Promise<{ id: string; draftId: string }>
}

async function loadTemplateDraft(programId: string, draftId: string): Promise<TemplateDraft | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { data, error } = await supabase
      .from('template_drafts')
      .select('id, program_id, pass_kind, based_on_template, layout, assets, updated_at')
      .eq('program_id', programId)
      .eq('id', draftId)
      .single()

    if (error || !data) {
      return null
    }

    return data as TemplateDraft
  } catch (error) {
    console.error('Failed to load template draft:', error)
    return null
  }
}

export default async function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const { id: programId, draftId } = await params
  
  if (!programId || !draftId) {
    notFound()
  }

  const draft = await loadTemplateDraft(programId, draftId)
  
  if (!draft) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/programs/${programId}/templates`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Template Editor
            </h1>
            <p className="text-muted-foreground">
              Edit {draft.pass_kind} template draft
            </p>
          </div>
        </div>
      </div>

      {/* Editor component */}
      <EditorClient draft={draft} programId={programId} />
    </div>
  )
}