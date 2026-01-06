'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCv(cvId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autorizado' }
    }

    // Verify admin access
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return { error: 'No autorizado' }
    }

    // Delete CV (cascade will delete versions, messages, feedback, assets)
    const { error: deleteError } = await supabase
      .from('cv_lab_cvs')
      .delete()
      .eq('id', cvId)

    if (deleteError) {
      console.error('Error deleting CV:', deleteError)
      return { error: deleteError.message }
    }

    // Revalidate the page
    revalidatePath('/admin/cv-lab')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteCv:', error)
    return { error: 'Error interno del servidor' }
  }
}
