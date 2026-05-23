import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const entity_type = searchParams.get('entity_type')
  const entity_id = searchParams.get('entity_id')
  if (!entity_type || !entity_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const { data, error } = await supabase.from('documents')
    .select('*').eq('entity_type', entity_type).eq('entity_id', entity_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const { name, file_path, file_size, mime_type, entity_type, entity_id, uploaded_by } = body
  const { data, error } = await supabase.from('documents')
    .insert([{ name, file_path, file_size, mime_type, entity_type, entity_id, uploaded_by }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req) {
  const { id, file_path } = await req.json()
  // Delete from storage
  if (file_path) {
    await supabase.storage.from('documents').remove([file_path])
  }
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
