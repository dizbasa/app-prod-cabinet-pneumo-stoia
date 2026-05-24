import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const medic_id = searchParams.get('medic_id')

  // No joins - separate queries only
  const q = supabase.from('medic_services').select('id, medic_id, service_id')
  if (medic_id) q.eq('medic_id', medic_id)
  const { data: ms, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const svcIds = [...new Set((ms||[]).map(r => r.service_id))]
  let svcMap = {}
  if (svcIds.length > 0) {
    const { data: svcs } = await supabase.from('services').select('id, name, icon').in('id', svcIds)
    ;(svcs||[]).forEach(s => { svcMap[s.id] = s })
  }

  const result = (ms||[]).map(r => ({ ...r, services: svcMap[r.service_id] || null }))
  return NextResponse.json(result)
}

export async function POST(req) {
  const { medic_id, service_id } = await req.json()
  const { data, error } = await supabase
    .from('medic_services')
    .upsert({ medic_id, service_id }, { onConflict: 'medic_id,service_id' })
    .select('id, medic_id, service_id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req) {
  const { medic_id, service_id } = await req.json()
  const { error } = await supabase
    .from('medic_services')
    .delete()
    .eq('medic_id', medic_id)
    .eq('service_id', service_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
