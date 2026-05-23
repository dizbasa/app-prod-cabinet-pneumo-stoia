import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data } = await supabase.from('feature_flags').select('*').order('flag')
  return NextResponse.json(data)
}
export async function PUT(req) {
  const { flag, enabled } = await req.json()
  await supabase.from('feature_flags').update({ enabled }).eq('flag', flag)
  return NextResponse.json({ ok: true })
}
