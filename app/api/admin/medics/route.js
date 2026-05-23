import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: medics, error } = await supabase.from('medics').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: ms } = await supabase.from('medic_services').select('id, medic_id, service_id')
  const { data: svcs } = await supabase.from('services').select('id, name, icon')
  const svcMap = {}
  ;(svcs||[]).forEach(s => { svcMap[s.id] = s })
  const msMap = {}
  ;(ms||[]).forEach(r => {
    if (!msMap[r.medic_id]) msMap[r.medic_id] = []
    msMap[r.medic_id].push({ service_id: r.service_id, services: svcMap[r.service_id] || null })
  })
  const result = (medics||[]).map(m => ({ ...m, medic_services: msMap[m.id] || [] }))
  return NextResponse.json(result)
}

export async function POST(req) {
  const body = await req.json()
  const { staffPassword, medic_services, ...medicData } = body
  const { data, error } = await supabase.from('medics').insert([medicData]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (staffPassword && data.email) {
    await supabase.from('staff').upsert(
      { name: data.name, email: data.email, role: 'medic', medic_id: data.id, password_hash: staffPassword, active: true },
      { onConflict: 'email' }
    )
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req) {
  const body = await req.json()
  const { id, staffPassword, medic_services, ...medicData } = body
  const { data, error } = await supabase.from('medics').update(medicData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Always sync staff account name/email, optionally update password
  const staffUpdate = { name: medicData.name, email: medicData.email, role: 'medic', medic_id: id, active: true }
  if (staffPassword) staffUpdate.password_hash = staffPassword
  await supabase.from('staff').upsert(staffUpdate, { onConflict: 'email' })

  // Also update medic_name on future bookings (past ones keep their snapshot)
  // Update medic_name on visits going forward — only visits with no sub-items yet
  // Actually: update denormalized medic_name in bookings & visits to keep UI consistent
  await supabase.from('bookings').update({ medic_name: medicData.name }).eq('medic_id', id)
  await supabase.from('visits').update({ medic_name: medicData.name }).eq('medic_id', id)

  return NextResponse.json(data)
}

export async function DELETE(req) {
  const { id } = await req.json()
  await supabase.from('staff').delete().eq('medic_id', id)
  await supabase.from('medic_services').delete().eq('medic_id', id)
  await supabase.from('medic_flags').delete().eq('medic_id', id)
  const { error } = await supabase.from('medics').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
