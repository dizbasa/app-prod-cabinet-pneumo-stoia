import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

const DEFAULT_FLAGS = [
  { flag: 'bookings_create', label: 'Poate crea Programări',   category: 'programari' },
  { flag: 'visits_view',     label: 'Poate vedea Vizitele',    category: 'vizite' },
  { flag: 'documents_add',   label: 'Poate adăuga Documente',  category: 'documente' },
]

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const patient_id = searchParams.get('patient_id')
  if (!patient_id) return NextResponse.json({ error: 'Missing patient_id' }, { status: 400 })

  const { data: saved } = await supabase.from('patient_flags').select('*').eq('patient_id', patient_id)
  const savedMap = {}
  ;(saved||[]).forEach(r => { savedMap[r.flag] = r.enabled })

  const result = DEFAULT_FLAGS.map(f => ({
    ...f, patient_id, enabled: savedMap[f.flag] !== undefined ? savedMap[f.flag] : true
  }))
  return NextResponse.json(result)
}

export async function PUT(req) {
  const { patient_id, flag, enabled } = await req.json()
  if (!patient_id || !flag) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  await supabase.from('patient_flags').upsert({ patient_id, flag, enabled }, { onConflict: 'patient_id,flag' })
  return NextResponse.json({ ok: true })
}
