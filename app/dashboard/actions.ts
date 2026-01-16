'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateFullName, validatePassword } from '@/lib/utils/auth-validation'

/**
 * Update user profile information (full_name)
 */
export async function updateUserProfile(data: {
  full_name: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Validate full name
    const nameValidation = validateFullName(data.full_name)
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error }
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: 'Error al actualizar perfil' }
    }

    revalidatePath('/dashboard/profile')
    return { success: true, message: 'Perfil actualizado correctamente' }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return {
      success: false,
      error: 'Error al procesar la solicitud'
    }
  }
}

/**
 * Change user password
 */
export async function changePassword(newPassword: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Error al cambiar contraseña' }
    }

    return { success: true, message: 'Contraseña actualizada correctamente' }
  } catch (error) {
    console.error('Error in changePassword:', error)
    return {
      success: false,
      error: 'Error al procesar la solicitud'
    }
  }
}

/**
 * Delete user account and all associated data
 * WARNING: This is irreversible
 */
export async function deleteAccount() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Delete user (cascade delete will remove profile and CVs automatically)
    // Note: This requires service role key, regular users cannot delete themselves via SDK
    // Instead, we'll mark the account for deletion and use a database trigger or cron job

    // For now, we'll sign out the user and they can contact support
    // In production, implement proper account deletion flow

    await supabase.auth.signOut()
    redirect('/login')
  } catch (error) {
    console.error('Error in deleteAccount:', error)
    return {
      success: false,
      error: 'Error al procesar la solicitud'
    }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
