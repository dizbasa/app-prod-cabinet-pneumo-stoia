import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return new Response('Missing ID', { status: 400 })

  await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id)
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single()

  return new Response(`<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F5F0E8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="background:#fff;border:1px solid #E5DFD3;padding:48px;max-width:480px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">✗</div>
    <h2 style="color:#8B3A3A;font-weight:300;font-size:28px;margin-bottom:16px;">Programare Respinsă</h2>
    <p style="color:#6B7A6E;">Programarea lui <strong>${booking?.patient_name}</strong> a fost respinsă.</p>
    <p style="margin-top:24px;font-size:12px;color:#6B7A6E;">Cabinet Pneumologie · Timișoara</p>
  </div></body></html>`, { headers: { 'Content-Type': 'text/html' } })
}

export async function POST(request) {
  const { id } = await request.json()
  await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id)
  return NextResponse.json({ ok: true })
}
