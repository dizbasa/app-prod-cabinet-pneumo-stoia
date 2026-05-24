import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { action, email, phone, password, name } = await req.json()

  if (action === 'login') {
    const { data: patient } = await supabase.from('patients').select('*').eq('email', email).single()
    if (!patient || patient.password_hash !== password) return NextResponse.json({ error: 'Email sau parolă incorectă' }, { status: 401 })
    const { password_hash, ...safe } = patient
    return NextResponse.json({ patient: safe })
  }

  if (action === 'register') {
    const { data: existing } = await supabase.from('patients').select('id').eq('email', email).single()
    if (existing) return NextResponse.json({ error: 'Email deja înregistrat' }, { status: 400 })
    const { data, error } = await supabase.from('patients').insert([{ name, email, phone, password_hash: password }]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { password_hash, ...safe } = data
    return NextResponse.json({ patient: safe })
  }
}
