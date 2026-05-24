import { supabase } from '../../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get('file')
  const entity_type = formData.get('entity_type')
  const entity_id = formData.get('entity_id')
  const uploaded_by = formData.get('uploaded_by') || 'unknown'

  if (!file || !entity_type || !entity_id)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const path = `${entity_type}/${entity_id}/${Date.now()}_${file.name.replace(/\s+/g,'_')}`

  const { error: uploadError } = await supabase.storage
    .from('documents').upload(path, buffer, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase.from('documents')
    .insert([{ name: file.name, file_path: path, file_size: file.size, mime_type: file.type, entity_type, entity_id, uploaded_by }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
