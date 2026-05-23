import { supabase } from '../../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data } = await supabase.from('staff').select('*').order('name')
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  // Check if staff with this email already exists
  const { data: existing } = await supabase.from('staff').select('id').eq('email', body.email).single()
  if (existing) {
    // Update existing
    const { data, error } = await supabase.from('staff').update({
      name: body.name, role: body.role, medic_id: body.medic_id,
      password_hash: body.password_hash, active: body.active
    }).eq('email', body.email).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  const { data, error } = await supabase.from('staff').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req) {
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('staff').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
