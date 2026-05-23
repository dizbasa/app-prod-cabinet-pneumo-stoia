import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase.from('patients').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const { data, error } = await supabase.from('patients').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req) {
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('patients').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Sync patient_name on bookings
  if (body.name) {
    await supabase.from('bookings').update({ patient_name: body.name }).eq('patient_id', id)
  }
  return NextResponse.json(data)
}

export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
