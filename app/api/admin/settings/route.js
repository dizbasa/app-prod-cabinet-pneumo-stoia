import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data } = await supabase.from('clinic_settings').select('*')
  const settings = {}
  ;(data || []).forEach(r => { settings[r.key] = r.value })
  return NextResponse.json(settings)
}
export async function PUT(req) {
  const updates = await req.json()
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from('clinic_settings').upsert({ key, value })
  }
  return NextResponse.json({ ok: true })
}
