import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CvLabLayout } from '@/components/cv-lab/cv-lab-layout'
import type { CvLabCv, CvLabVersion, CvLabMessage } from '@/lib/types/cv-lab'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CvLabEditorPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/admin/login')
  }

  // Verify admin usando profiles.role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login')
  }

  // Get CV with versions and messages
  const { data: cv, error: cvError } = await supabase
    .from('cv_lab_cvs')
    .select('*')
    .eq('id', id)
    .single()

  if (cvError || !cv) {
    notFound()
  }

  // Get versions
  const { data: versions } = await supabase
    .from('cv_lab_versions')
    .select('*')
    .eq('cv_id', id)
    .order('version_number', { ascending: false })

  // Get messages (excluding system messages for display, but including for context)
  const { data: messages } = await supabase
    .from('cv_lab_messages')
    .select('*')
    .eq('cv_id', id)
    .order('created_at', { ascending: true })

  return (
    <CvLabLayout
      cv={cv as CvLabCv}
      versions={(versions || []) as CvLabVersion[]}
      messages={(messages || []) as CvLabMessage[]}
    />
  )
}
