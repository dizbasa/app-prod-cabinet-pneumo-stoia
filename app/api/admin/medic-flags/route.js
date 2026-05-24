import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

const DEFAULT_FLAGS = [
  { flag: 'visits_add',          label: 'Poate adăuga Vizite',                      category: 'vizite' },
  { flag: 'visits_delete',       label: 'Poate șterge Vizite',                      category: 'vizite' },
  { flag: 'symptoms_add',        label: 'Poate adăuga Simptome la Vizite',          category: 'vizite' },
  { flag: 'symptoms_delete',     label: 'Poate șterge Simptome la Vizite',          category: 'vizite' },
  { flag: 'diagnostics_add',     label: 'Poate adăuga Diagnostice la Vizite',       category: 'vizite' },
  { flag: 'diagnostics_delete',  label: 'Poate șterge Diagnostice la Vizite',       category: 'vizite' },
  { flag: 'treatments_add',      label: 'Poate adăuga Tratamente la Vizite',        category: 'vizite' },
  { flag: 'treatments_delete',   label: 'Poate șterge Tratamente la Vizite',        category: 'vizite' },
  { flag: 'nom_view',               label: 'Poate vedea Nomenclatorul',                  category: 'nomenclator' },
  { flag: 'nom_symptoms_add',       label: 'Poate adăuga Simptome în Nomenclator',       category: 'nomenclator' },
  { flag: 'nom_symptoms_edit',      label: 'Poate edita Simptome în Nomenclator',        category: 'nomenclator' },
  { flag: 'nom_symptoms_delete',    label: 'Poate șterge Simptome din Nomenclator',      category: 'nomenclator' },
  { flag: 'nom_diagnostics_add',    label: 'Poate adăuga Diagnostice în Nomenclator',    category: 'nomenclator' },
  { flag: 'nom_diagnostics_edit',   label: 'Poate edita Diagnostice în Nomenclator',     category: 'nomenclator' },
  { flag: 'nom_diagnostics_delete', label: 'Poate șterge Diagnostice din Nomenclator',   category: 'nomenclator' },
  { flag: 'nom_treatments_add',     label: 'Poate adăuga Tratamente în Nomenclator',     category: 'nomenclator' },
  { flag: 'nom_treatments_edit',    label: 'Poate edita Tratamente în Nomenclator',      category: 'nomenclator' },
  { flag: 'nom_treatments_delete',  label: 'Poate șterge Tratamente din Nomenclator',    category: 'nomenclator' },
  { flag: 'patients_view',   label: 'Poate vedea Pacienții',  category: 'pacienti' },
  { flag: 'patients_add',    label: 'Poate adăuga Pacienți',  category: 'pacienti' },
  { flag: 'patients_edit',   label: 'Poate edita Pacienți',   category: 'pacienti' },
  { flag: 'patients_delete', label: 'Poate șterge Pacienți',  category: 'pacienti' },
  { flag: 'bookings_approve',            label: 'Poate aproba/respinge Programări',         category: 'programari' },
  { flag: 'bookings_edit',               label: 'Poate edita Programări',                   category: 'programari' },
  { flag: 'bookings_delete',             label: 'Poate șterge Programări',                  category: 'programari' },
  { flag: 'bookings_create_for_patient', label: 'Poate face Programări pentru un Pacient',  category: 'programari' },
  { flag: 'bookings_view_colleagues',    label: 'Poate vedea calendarul colegilor',          category: 'programari' },
  { flag: 'bookings_reassign_medic',        label: 'Poate schimba Medicul unei Programări (și acces Panou)',   category: 'programari' },
  { flag: 'documents_view',   label: 'Poate vedea Documentele', category: 'documente' },
  { flag: 'documents_add',    label: 'Poate adăuga Documente',  category: 'documente' },
  { flag: 'documents_delete', label: 'Poate șterge Documente',  category: 'documente' },
]

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const medic_id = searchParams.get('medic_id')
  if (!medic_id) return NextResponse.json({ error: 'Missing medic_id' }, { status: 400 })
  const { data: saved } = await supabase.from('medic_flags').select('flag, enabled').eq('medic_id', medic_id)
  const savedMap = {}
  ;(saved||[]).forEach(r => { savedMap[r.flag] = r.enabled })
  return NextResponse.json(DEFAULT_FLAGS.map(f => ({ ...f, medic_id, enabled: savedMap[f.flag] !== undefined ? savedMap[f.flag] : true })))
}

export async function PUT(req) {
  const { medic_id, flag, enabled } = await req.json()
  if (!medic_id || !flag) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  await supabase.from('medic_flags').upsert({ medic_id, flag, enabled }, { onConflict: 'medic_id,flag' })
  return NextResponse.json({ ok: true })
}
