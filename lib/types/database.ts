// Types for Supabase database tables

export interface Profile {
  id: string
  name: string
  title: string | null
  tagline: string | null
  bio: string | null
  profile_image_url: string | null
  cv_url: string | null
  email: string | null
  phone: string | null
  location: string | null
  website: string | null
  github_url: string | null
  linkedin_url: string | null
  updated_at: string
}

export interface Project {
  id: string
  title: string
  description: string | null
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  image_url: string | null
  metrics: Record<string, string> | null
  is_featured: boolean
  is_confidential: boolean
  impact: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  description: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  achievements: string[]
  tech_stack: string[]
  order_index: number
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  years_experience: number | null
  order_index: number
  created_at: string
}

export interface Credential {
  id: string
  title: string
  issuer: string
  date_issued: string
  credential_url: string | null
  icon_url: string | null
  credential_type: 'certification' | 'award' | 'degree'
  order_index: number
  created_at: string
}

export interface Resume {
  id: string
  name: string
  variant_type: string
  file_url: string
  file_key: string
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface PortfolioSettings {
  id: string
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface Analytics {
  id: string
  date: string
  page_views: number
  unique_visitors: number
  contact_form_submissions: number
  project_clicks: Record<string, number> | null
  created_at: string
}

export interface Admin {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

// Settings value types
export interface HeroSection {
  name: string
  title: string
  description: string
  tagline: string
}

export interface AboutSection {
  title: string
  content: string
  highlight: string
}

export interface ContactInfo {
  email: string
  phone: string
  location: string
  website: string
  github: string
  linkedin: string
}

export interface Metrics {
  projects_completed: number
  companies_served: number
  years_experience: number
  technologies: number
  roi_generated: number
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'id' | 'updated_at'>
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type WorkExperienceInsert = Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>
export type SkillInsert = Omit<Skill, 'id' | 'created_at'>
export type CredentialInsert = Omit<Credential, 'id' | 'created_at'>
export type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'>

// Update types (all fields optional except id)
export type ProfileUpdate = Partial<ProfileInsert>
export type ProjectUpdate = Partial<ProjectInsert>
export type WorkExperienceUpdate = Partial<WorkExperienceInsert>
export type SkillUpdate = Partial<SkillInsert>
export type CredentialUpdate = Partial<CredentialInsert>
export type ResumeUpdate = Partial<ResumeInsert>
