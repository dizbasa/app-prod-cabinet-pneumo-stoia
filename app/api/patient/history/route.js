import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patient_id')
  if (!patientId) return NextResponse.json({ error: 'Missing patient_id' }, { status: 400 })

  const { data: visits, error } = await supabase.from('visits').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const full = await Promise.all((visits || []).map(async v => {
    const [symp, diag, treat, svc, docs] = await Promise.all([
      supabase.from('symptoms').select('*').eq('visit_id', v.id),
      supabase.from('diagnostics').select('*').eq('visit_id', v.id),
      supabase.from('treatments').select('*').eq('visit_id', v.id),
      supabase.from('visit_services').select('*').eq('visit_id', v.id),
      supabase.from('documents').select('id').eq('entity_type', 'visit').eq('entity_id', v.id),
    ])
    return {
      ...v,
      symptoms: symp.data||[],
      diagnostics: diag.data||[],
      treatments: treat.data||[],
      services: svc.data||[],
      doc_count: (docs.data||[]).length
    }
  }))

  return NextResponse.json(full)
}
