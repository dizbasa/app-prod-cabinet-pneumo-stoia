import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const body = await req.json()
  const {
    patient_name, patient_email, phone,
    medic_id, medic_name,
    appointment_date, appointment_time,
    reason, status = 'approved'
  } = body

  // Try to find existing patient by phone or email
  let patient_id = null
  if (phone) {
    const { data: ep } = await supabase.from('patients').select('id').eq('phone', phone).single()
    if (ep) patient_id = ep.id
  }
  if (!patient_id && patient_email) {
    const { data: ep } = await supabase.from('patients').select('id').eq('email', patient_email).single()
    if (ep) patient_id = ep.id
  }

  const { data, error } = await supabase.from('bookings').insert([{
    patient_id, patient_name, patient_email, phone,
    medic_id, medic_name,
    appointment_date, appointment_time,
    reason, status
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
