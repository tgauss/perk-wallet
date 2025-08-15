export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TemplateDesigner } from '@/components/template-studio-v2/template-designer'
import { ProgramThemeProvider } from '@/components/branding/program-theme-provider'

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
    <ProgramThemeProvider programId={programId}>
      <TemplateDesigner 
        programId={programId} 
        draftId={draftId} 
      />
    </ProgramThemeProvider>
  )
}