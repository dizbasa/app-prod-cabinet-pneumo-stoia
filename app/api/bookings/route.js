import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase.from('bookings').select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const {
    patient_name, patient_email, phone, reason,
    service_id, service_name, appointment_date, appointment_time,
    preferred_medic_id, hcaptcha_token
  } = body

  // Verify hCaptcha
  if (hcaptcha_token) {
    const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${hcaptcha_token}`
    })
    const verifyData = await verifyRes.json()
    if (!verifyData.success) return NextResponse.json({ error: 'Verificare captcha eșuată' }, { status: 400 })
  }

  // Find or create patient
  let patient_id = null
  if (phone) {
    const { data: ep } = await supabase.from('patients').select('id').eq('phone', phone).single()
    if (ep) patient_id = ep.id
  }
  if (!patient_id && patient_email) {
    const { data: ep } = await supabase.from('patients').select('id').eq('email', patient_email).single()
    if (ep) patient_id = ep.id
  }
  if (!patient_id && patient_name && phone) {
    const { data: np } = await supabase.from('patients')
      .insert([{ name: patient_name, email: patient_email, phone }]).select().single()
    if (np) patient_id = np.id
  }

  // Assign medic
  const { data: existingBookings } = await supabase.from('bookings')
    .select('medic_id').eq('appointment_date', appointment_date)
    .eq('appointment_time', appointment_time).eq('status', 'approved')

  const takenMedicIds = (existingBookings||[]).map(b => b.medic_id)
  const { data: availableMedics } = await supabase.from('medics').select('*').eq('active', true)
  
  let assignedMedic = null
  if (preferred_medic_id && !takenMedicIds.includes(preferred_medic_id)) {
    assignedMedic = (availableMedics||[]).find(m => m.id === preferred_medic_id)
  } else {
    assignedMedic = (availableMedics||[]).find(m => !takenMedicIds.includes(m.id))
  }

  const { data, error } = await supabase.from('bookings').insert([{
    patient_id, patient_name, patient_email, phone, reason,
    service_id: service_id||null, service_name: service_name||null,
    appointment_date, appointment_time,
    medic_id: assignedMedic?.id || null,
    medic_name: assignedMedic?.name || null,
    status: 'pending'
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email notification (fire and forget)
  if (assignedMedic?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    try {
      const { sendBookingEmail } = await import('../../../lib/email')
      await sendBookingEmail({ booking: data, medic: assignedMedic, appUrl })
    } catch(e) { console.error('Email error:', e) }
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req) {
  const { id, ...body } = await req.json()
  const med = body.medic_id ? (await supabase.from('medics').select('name').eq('id', body.medic_id).single()).data : null
  if (med) body.medic_name = med.name
  const { data, error } = await supabase.from('bookings').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
