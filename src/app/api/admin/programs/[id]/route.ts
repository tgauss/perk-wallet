import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: program, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}