'use server'

import { createClient } from '@/lib/supabase/server'

// Get user's templates for a specific format
export async function getTemplates(format: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('format', format)
    .or(`is_default.eq.true,user_id.eq.${user.id}`)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Save or update template
export async function saveTemplate(template: {
  id?: string
  name: string
  format: string
  settings: Record<string, any>
  text_content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  if (template.id) {
    const { error } = await supabase
      .from('templates')
      .update({ ...template, updated_at: new Date() })
      .eq('id', template.id)

    if (error) throw error
    return template
  }

  const { data, error } = await supabase
    .from('templates')
    .insert([{ ...template, is_default: false }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete template
export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('is_default', false)

  if (error) throw error
  return true
}

// Get or create user settings
export async function getUserSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  let { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Not found, create default
    const { data: newSettings, error: insertError } = await supabase
      .from('user_settings')
      .insert([{ user_id: user.id }])
      .select()
      .single()

    if (insertError) throw insertError
    return newSettings
  }

  if (error) throw error
  return data
}

// Update user settings
export async function updateUserSettings(settings: Record<string, any>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', user.id)

  if (error) throw error
  return true
}

// Create batch export
export async function createBatchExport(items: Array<{
  format: string
  settings: Record<string, any>
  text_content: string
  image_url?: string
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: batch, error: batchError } = await supabase
    .from('batch_exports')
    .insert([{
      user_id: user.id,
      total_images: items.length,
      status: 'pending'
    }])
    .select()
    .single()

  if (batchError) throw batchError

  const { error: itemsError } = await supabase
    .from('batch_export_items')
    .insert(items.map(item => ({
      batch_id: batch.id,
      ...item,
      status: 'pending'
    })))

  if (itemsError) throw itemsError
  return batch
}

// Get batch exports
export async function getBatchExports() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('batch_exports')
    .select('*, batch_export_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
