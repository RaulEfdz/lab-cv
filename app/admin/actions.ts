"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Helper function to verify admin status
async function verifyAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("No autenticado")
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single()

  if (adminError || !admin) {
    throw new Error("No autorizado como administrador")
  }

  return { supabase, user }
}

// ==================== PROJECTS ====================

export async function deleteProject(id: string) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar proyecto" }
    }

    revalidatePath("/admin/projects")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateProject(id: string, data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("projects").update(data).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar proyecto" }
    }

    revalidatePath("/admin/projects")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function createProject(data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("projects").insert(data)

    if (error) {
      return { success: false, error: "Error al crear proyecto" }
    }

    revalidatePath("/admin/projects")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== EXPERIENCE ====================

export async function deleteExperience(id: string) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("work_experience").delete().eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar experiencia" }
    }

    revalidatePath("/admin/experience")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateExperience(id: string, data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("work_experience").update(data).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar experiencia" }
    }

    revalidatePath("/admin/experience")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function createExperience(data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("work_experience").insert(data)

    if (error) {
      return { success: false, error: "Error al crear experiencia" }
    }

    revalidatePath("/admin/experience")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== SKILLS ====================

export async function deleteSkill(id: string) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("skills").delete().eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar habilidad" }
    }

    revalidatePath("/admin/skills")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateSkill(id: string, data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("skills").update(data).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar habilidad" }
    }

    revalidatePath("/admin/skills")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function createSkill(data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("skills").insert(data)

    if (error) {
      return { success: false, error: "Error al crear habilidad" }
    }

    revalidatePath("/admin/skills")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== CREDENTIALS ====================

export async function deleteCredential(id: string) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("credentials").delete().eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar credencial" }
    }

    revalidatePath("/admin/credentials")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateCredential(id: string, data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("credentials").update(data).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar credencial" }
    }

    revalidatePath("/admin/credentials")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function createCredential(data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase.from("credentials").insert(data)

    if (error) {
      return { success: false, error: "Error al crear credencial" }
    }

    revalidatePath("/admin/credentials")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== PROFILE ====================

export async function updateProfile(data: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    // Upsert profile (insert or update)
    const { error } = await supabase
      .from("profile")
      .upsert({ id: "main", ...data, updated_at: new Date().toISOString() })

    if (error) {
      return { success: false, error: "Error al actualizar perfil" }
    }

    revalidatePath("/admin/profile")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== SETTINGS ====================

export async function updateSettings(key: string, value: Record<string, unknown>) {
  try {
    const { supabase } = await verifyAdmin()

    const { error } = await supabase
      .from("portfolio_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) {
      return { success: false, error: "Error al actualizar configuración" }
    }

    revalidatePath("/admin/settings")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// ==================== AUTH ====================

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}
