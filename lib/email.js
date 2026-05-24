import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
// Use Resend's default sender for free tier (no domain verification needed)
const FROM = 'Cabinet Pneumologie <onboarding@resend.dev>'

export async function sendBookingRequestToMedic({ medic, patient, booking, approveUrl, rejectUrl }) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: medic.email,
    subject: `Programare nouă: ${patient.name} — ${booking.appointment_date} ${booking.appointment_time}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1A1A;">
        <div style="background:#1A3A2A;padding:32px;text-align:center;">
          <h1 style="color:#F5F0E8;font-weight:300;margin:0;font-size:28px;">🫁 Cabinet Pneumologie</h1>
          <p style="color:#B8D4BE;margin:8px 0 0;font-size:13px;letter-spacing:0.1em;">PROGRAMARE NOUĂ</p>
        </div>
        <div style="padding:40px 32px;background:#FDFAF5;">
          <p style="font-size:16px;color:#6B7A6E;">Dragă <strong style="color:#1A3A2A;">${medic.name}</strong>,</p>
          <p style="color:#6B7A6E;line-height:1.6;">Ai primit o nouă solicitare de programare:</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#fff;border:1px solid #E5DFD3;">
            ${[['Pacient',patient.name],['Telefon',patient.phone],['Email',patient.email||'—'],['Data',booking.appointment_date],['Ora',booking.appointment_time],['Serviciu',booking.service_name||'—'],['Motiv',booking.reason||'—']].map(([l,v])=>`<tr><td style="padding:10px 16px;color:#6B7A6E;font-size:13px;width:120px;border-bottom:1px solid #F0EBE0;">${l}</td><td style="padding:10px 16px;color:#1A3A2A;font-weight:500;border-bottom:1px solid #F0EBE0;">${v}</td></tr>`).join('')}
          </table>
          <div style="margin-top:32px;display:flex;gap:12px;">
            <a href="${approveUrl}" style="display:inline-block;background:#1A3A2A;color:#F5F0E8;padding:14px 28px;text-decoration:none;font-size:13px;letter-spacing:0.08em;margin-right:12px;">✓ APROBĂ PROGRAMAREA</a>
            <a href="${rejectUrl}" style="display:inline-block;background:#8B3A3A;color:#F5F0E8;padding:14px 28px;text-decoration:none;font-size:13px;letter-spacing:0.08em;">✗ RESPINGE</a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#F0EBE0;text-align:center;font-size:12px;color:#6B7A6E;">Cabinet Pneumologie · Timișoara</div>
      </div>
    `
  })
  if (error) console.error('Resend error (medic):', error)
}

export async function sendBookingApprovedToPatient({ patient, booking }) {
  if (!patient.email) return
  const { error } = await resend.emails.send({
    from: FROM,
    to: patient.email,
    subject: `✓ Programare confirmată — ${booking.appointment_date} ora ${booking.appointment_time}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
        <div style="background:#1A3A2A;padding:32px;text-align:center;">
          <h1 style="color:#F5F0E8;font-weight:300;margin:0;font-size:28px;">🫁 Cabinet Pneumologie</h1>
        </div>
        <div style="padding:40px 32px;background:#FDFAF5;text-align:center;">
          <div style="font-size:56px;margin-bottom:16px;">✓</div>
          <h2 style="color:#1A3A2A;font-weight:300;font-size:28px;margin-bottom:8px;">Programare Confirmată</h2>
          <p style="color:#6B7A6E;margin-bottom:32px;">Dragă <strong>${patient.name}</strong>, programarea ta a fost aprobată.</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E5DFD3;text-align:left;">
            ${[['Medic',booking.medic_name],['Data',booking.appointment_date],['Ora',booking.appointment_time],['Serviciu',booking.service_name||'—']].map(([l,v])=>`<tr><td style="padding:10px 16px;color:#6B7A6E;font-size:13px;width:120px;border-bottom:1px solid #F0EBE0;">${l}</td><td style="padding:10px 16px;color:#1A3A2A;font-weight:500;border-bottom:1px solid #F0EBE0;">${v}</td></tr>`).join('')}
          </table>
          <p style="color:#6B7A6E;font-size:13px;margin-top:24px;">Adresă: Str. Memorandumului 12, Timișoara · Tel: +40 256 123 456</p>
        </div>
        <div style="padding:16px 32px;background:#F0EBE0;text-align:center;font-size:12px;color:#6B7A6E;">Cabinet Pneumologie · Timișoara</div>
      </div>
    `
  })
  if (error) console.error('Resend error (patient approved):', error)
}

export async function sendBookingCancelledToPatient({ patient, booking }) {
  if (!patient.email) return
  const { error } = await resend.emails.send({
    from: FROM,
    to: patient.email,
    subject: `Programarea ta a fost anulată — ${booking.appointment_date}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
        <div style="background:#1A3A2A;padding:32px;text-align:center;">
          <h1 style="color:#F5F0E8;font-weight:300;margin:0;font-size:28px;">🫁 Cabinet Pneumologie</h1>
        </div>
        <div style="padding:40px 32px;background:#FDFAF5;">
          <p style="color:#6B7A6E;">Dragă <strong style="color:#1A3A2A;">${patient.name}</strong>,</p>
          <p style="color:#6B7A6E;line-height:1.6;">Ne pare rău, programarea ta din <strong>${booking.appointment_date} la ${booking.appointment_time}</strong> a fost anulată deoarece intervalul a fost ocupat de alt pacient. Te rugăm să faci o nouă programare.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'}" style="display:inline-block;background:#1A3A2A;color:#F5F0E8;padding:12px 24px;text-decoration:none;font-size:13px;margin-top:24px;">Fă o nouă programare</a>
        </div>
        <div style="padding:16px 32px;background:#F0EBE0;text-align:center;font-size:12px;color:#6B7A6E;">Cabinet Pneumologie · Timișoara</div>
      </div>
    `
  })
  if (error) console.error('Resend error (patient cancelled):', error)
}
