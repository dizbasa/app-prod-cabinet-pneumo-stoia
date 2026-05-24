import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { email, password } = await request.json()

  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .eq('email', email)
    .eq('active', true)
    .single()

  if (error || !staff) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  if (staff.password_hash !== password) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  // Fetch medic separately if this staff member is a medic
  let medic = null
  if (staff.medic_id) {
    const { data: m } = await supabase.from('medics').select('*').eq('id', staff.medic_id).single()
    medic = m || null
  }

  const { password_hash, ...safeStaff } = staff
  return NextResponse.json({ staff: { ...safeStaff, medics: medic } })
}
