import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get('file')
  const type = formData.get('type')

  if (!file || type !== 'patients') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    // Convert with header:1 to get raw array rows
    const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (!allRows.length) return NextResponse.json({ error: 'Fișier gol' }, { status: 400 })

    // Find the header row (first row containing 'Nume' or 'CNP')
    let headerRowIdx = 0
    for (let i = 0; i < Math.min(5, allRows.length); i++) {
      const row = allRows[i].map(c => String(c).toLowerCase())
      if (row.some(c => c === 'nume' || c === 'cnp')) {
        headerRowIdx = i
        break
      }
    }

    const headers = allRows[headerRowIdx].map(h => String(h).trim())
    const dataRows = allRows.slice(headerRowIdx + 1).filter(r => r.some(c => String(c).trim()))

    console.log('Headers found:', headers)
    console.log('Data rows:', dataRows.length)

    if (!dataRows.length) return NextResponse.json({ error: 'Nu există date după antet' }, { status: 400 })

    const colIdx = (names) => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
        if (idx >= 0) return idx
      }
      return -1
    }

    const numeIdx     = colIdx(['Nume'])
    const prenumeIdx  = colIdx(['Prenume'])
    const cnpIdx      = colIdx(['CNP'])
    const cidIdx      = colIdx(['CID'])
    const sexIdx      = colIdx(['Sex'])
    const nastIdx     = colIdx(['nasterii', 'nastere', 'birth'])
    const deces_idx   = colIdx(['decesului', 'deces'])
    const orasIdx     = colIdx(['Ora', 'city'])
    const judetIdx    = colIdx(['Judet', 'Jude'])
    const adresaIdx   = colIdx(['Adres'])

    console.log('Column indices:', { numeIdx, prenumeIdx, cnpIdx, nastIdx })

    const parseDate = v => {
      if (!v) return null
      if (v instanceof Date) return v.toISOString().split('T')[0]
      const s = String(v).trim()
      if (!s || s === '0') return null
      // DD/MM/YYYY
      const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`
      // YYYY-MM-DD
      const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (m2) return s.split('T')[0]
      return null
    }

    let imported = 0, skipped = 0, errors = 0
    const errorDetails = []

    for (let ri = 0; ri < dataRows.length; ri++) {
      const row = dataRows[ri]
      try {
        const get = idx => idx >= 0 ? String(row[idx] || '').trim() : ''
        const name = get(numeIdx)
        const prenume = get(prenumeIdx)
        const cnp = get(cnpIdx)

        if (!name && !prenume) { errors++; errorDetails.push(`Rând ${ri+1}: Lipsesc Nume și Prenume`); continue }

        // Check duplicate by CNP
        if (cnp) {
          const { data: existing } = await supabase.from('patients').select('id').eq('cnp', cnp).single()
          if (existing) { skipped++; continue }
        }

        const sex = get(sexIdx).toUpperCase()
        const { error } = await supabase.from('patients').insert([{
          name: name || prenume,
          prenume: prenume || null,
          cnp: cnp || null,
          cid: get(cidIdx) || null,
          sex: sex === 'M' || sex === 'F' ? sex : null,
          data_nasterii: parseDate(nastIdx >= 0 ? row[nastIdx] : null),
          data_decesului: parseDate(deces_idx >= 0 ? row[deces_idx] : null),
          oras: get(orasIdx) || null,
          judet: get(judetIdx) || null,
          adresa: get(adresaIdx) || null,
          active: true,
        }])

        if (error) {
          errors++
          errorDetails.push(`Rând ${ri+1} (${name}): ${error.message}`)
          console.error('Insert error:', error.message)
        } else {
          imported++
        }
      } catch(e) {
        errors++
        errorDetails.push(`Rând ${ri+1}: ${e.message}`)
      }
    }

    return NextResponse.json({ imported, skipped, errors, total: dataRows.length, errorDetails: errorDetails.slice(0,5) })
  } catch(e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: `Eroare la procesare: ${e.message}` }, { status: 500 })
  }
}
