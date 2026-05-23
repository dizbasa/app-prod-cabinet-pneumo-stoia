import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return new Response('Missing booking ID', { status: 400 })

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single()
  if (!booking) return new Response('Booking not found', { status: 404 })
  if (booking.status === 'approved') return new Response(html('Deja aprobată', 'Această programare a fost deja aprobată.'), { headers: { 'Content-Type': 'text/html' } })

  // Approve booking
  await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)

  // Cancel conflicting pending bookings
  const { data: conflicts } = await supabase.from('bookings')
    .select('*')
    .eq('appointment_date', booking.appointment_date)
    .eq('appointment_time', booking.appointment_time)
    .eq('medic_id', booking.medic_id)
    .eq('status', 'pending')
    .neq('id', id)
  for (const c of (conflicts||[])) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', c.id)
  }

  // ── Create a Visit automatically ──────────────────────────────
  // Find or create patient
  let patient_id = booking.patient_id
  if (!patient_id && (booking.phone || booking.patient_email)) {
    const q = booking.phone
      ? supabase.from('patients').select('id').eq('phone', booking.phone)
      : supabase.from('patients').select('id').eq('email', booking.patient_email)
    const { data: p } = await q.single()
    if (p) patient_id = p.id
  }
  if (!patient_id && booking.patient_name) {
    const { data: np } = await supabase.from('patients')
      .insert([{ name: booking.patient_name, email: booking.patient_email||null, phone: booking.phone||null }])
      .select('id').single()
    if (np) patient_id = np.id
  }

  // Create visit if we have a patient
  if (patient_id) {
    // Check if a visit already exists for this booking (avoid duplicates)
    const { data: existing } = await supabase.from('visits')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('medic_id', booking.medic_id)
      .eq('visit_date', booking.appointment_date)
      .single()

    if (!existing) {
      await supabase.from('visits').insert([{
        patient_id,
        medic_id: booking.medic_id || null,
        medic_name: booking.medic_name || null,
        visit_date: booking.appointment_date,
        notes: booking.reason ? `Motiv programare: ${booking.reason}` : null,
      }])
    }
  }

  // Notify patient
  try {
    const { sendBookingApprovedToPatient } = await import('../../../../lib/email')
    await sendBookingApprovedToPatient({ patient: { name: booking.patient_name, email: booking.patient_email }, booking })
  } catch(e) { console.error('Email error:', e) }

  return new Response(html('Programare Aprobată ✓', `Programarea lui <strong>${booking.patient_name}</strong> din ${booking.appointment_date} la ${booking.appointment_time} a fost aprobată.${patient_id ? ' O vizită a fost creată automat.' : ''} Pacientul a fost notificat.`), { headers: { 'Content-Type': 'text/html' } })
}

export async function POST(request) {
  const body = await request.json()
  const { id } = body
  // Reuse GET logic
  return GET(new Request(`http://x/api/bookings/approve?id=${id}`))
}

function html(title, msg) {
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F5F0E8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="background:#fff;border:1px solid #E5DFD3;padding:48px;max-width:480px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">✓</div>
    <h2 style="color:#1A3A2A;font-weight:300;font-size:28px;margin-bottom:16px;">${title}</h2>
    <p style="color:#6B7A6E;line-height:1.6;">${msg}</p>
    <p style="margin-top:24px;font-size:12px;color:#6B7A6E;">Cabinet Pneumologie · Timișoara</p>
  </div></body></html>`
}
