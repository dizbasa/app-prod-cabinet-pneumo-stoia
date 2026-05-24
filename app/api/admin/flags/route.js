import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

// Default flags - always shown even if not yet in DB
const DEFAULT_FLAGS = [
  { flag: 'admin_bookings_view',   label: 'Admin: Vede Programările',    category: 'bookings', enabled: true },
  { flag: 'admin_bookings_approve',label: 'Admin: Poate aproba Programările',   category: 'bookings', enabled: true },
  { flag: 'admin_medics_add',      label: 'Admin: Poate adăuga Medici',         category: 'medics',   enabled: true },
  { flag: 'admin_medics_edit',     label: 'Admin: Poate edita Medici',          category: 'medics',   enabled: true },
  { flag: 'admin_medics_delete',   label: 'Admin: Poate șterge Medici',         category: 'medics',   enabled: true },
  { flag: 'admin_patients_add',    label: 'Admin: Poate adăuga Pacienți',       category: 'patients', enabled: true },
  { flag: 'admin_patients_edit',   label: 'Admin: Poate edita Pacienți',        category: 'patients', enabled: true },
  { flag: 'admin_patients_delete', label: 'Admin: Poate șterge Pacienți',       category: 'patients', enabled: true },
  { flag: 'admin_services_add',    label: 'Admin: Poate adăuga Servicii',       category: 'services', enabled: true },
  { flag: 'admin_services_edit',   label: 'Admin: Poate edita Servicii',        category: 'services', enabled: true },
  { flag: 'admin_services_delete', label: 'Admin: Poate șterge Servicii',       category: 'services', enabled: true },
  { flag: 'admin_homepage_edit',   label: 'Admin: Poate edita Pagina Principală',category:'homepage', enabled: true },
  { flag: 'medic_visits_add',      label: 'Admin: Medic poate adăuga Vizite',   category: 'visits',   enabled: true },
  { flag: 'medic_visits_edit',     label: 'Admin: Medic poate edita Vizite',    category: 'visits',   enabled: true },
  { flag: 'admin_medic_settings',  label: 'Admin: Acces Setări Medici',         category: 'medics',   enabled: true },
  { flag: 'admin_export',          label: 'Export: Pacienți',       category: 'export',   enabled: true },
  { flag: 'admin_export_bookings', label: 'Export: Programări',     category: 'export',   enabled: true },
  { flag: 'admin_export_visits',   label: 'Export: Vizite',         category: 'export',   enabled: true },
  { flag: 'admin_import',          label: 'Import: Pacienți',       category: 'import',   enabled: true },
  { flag: 'admin_import_visits',   label: 'Import: Vizite',         category: 'import',   enabled: false },
  { flag: 'admin_import_services', label: 'Import: Servicii',       category: 'import',   enabled: false },
  { flag: 'admin_import_nomenclator',label:'Import: Nomenclator',   category: 'import',   enabled: false },
  { flag: 'admin_overview',        label: 'Admin: Vede Prezentarea (overview)',  category: 'analytics', enabled: true },
]

export async function GET() {
  const { data } = await supabase.from('feature_flags').select('*').order('flag')
  const dbMap = {}
  ;(data||[]).forEach(f => { dbMap[f.flag] = f })

  // Merge: DB values override defaults
  const result = DEFAULT_FLAGS.map(def => ({
    ...def,
    ...(dbMap[def.flag] || {}),
    enabled: dbMap[def.flag] !== undefined ? dbMap[def.flag].enabled : def.enabled
  }))

  // Also include any DB flags not in defaults
  ;(data||[]).forEach(f => {
    if (!DEFAULT_FLAGS.find(d => d.flag === f.flag)) result.push(f)
  })

  return NextResponse.json(result)
}

export async function PUT(req) {
  const { flag, enabled } = await req.json()
  await supabase.from('feature_flags').upsert({ flag, enabled }, { onConflict: 'flag' })
  return NextResponse.json({ ok: true })
}
