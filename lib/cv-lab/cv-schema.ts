import { z } from 'zod'

// =============================================================================
// ZOD SCHEMAS FOR CV JSON VALIDATION
// =============================================================================

export const CvLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url()
})

export const CvHeaderSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  location: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  links: z.array(CvLinkSchema)
})

export const CvExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  startDate: z.string(), // MM/YYYY format
  endDate: z.string().nullable(),
  location: z.string(),
  bullets: z.array(z.string())
})

export const CvEducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  dates: z.string(),
  gpa: z.string().optional()
})

export const CvSkillsSchema = z.object({
  hard: z.array(z.string()),
  soft: z.array(z.string())
})

export const CvCertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
  url: z.string().url().optional()
})

export const CvConstraintsSchema = z.object({
  onePage: z.boolean(),
  language: z.enum(['es', 'en']),
  targetRole: z.string()
})

export const CvJsonSchema = z.object({
  header: CvHeaderSchema,
  summary: z.string(),
  experience: z.array(CvExperienceSchema),
  education: z.array(CvEducationSchema),
  skills: CvSkillsSchema,
  certifications: z.array(CvCertificationSchema),
  keywords: z.array(z.string()),
  constraints: CvConstraintsSchema
})

// Partial schema for updates
export const PartialCvJsonSchema = CvJsonSchema.partial()

// CV Update result from AI
export const CvUpdateResultSchema = z.object({
  action: z.enum(['update_section', 'full_update']),
  section: z.enum(['header', 'summary', 'experience', 'education', 'skills', 'certifications']).optional(),
  data: PartialCvJsonSchema,
  readinessScore: z.number().min(0).max(100),
  feedback: z.string()
})

// Type exports
export type CvJsonSchemaType = z.infer<typeof CvJsonSchema>
export type CvUpdateResultSchemaType = z.infer<typeof CvUpdateResultSchema>

// Validation helpers
export function validateCvJson(data: unknown): { success: true; data: CvJsonSchemaType } | { success: false; error: string } {
  const result = CvJsonSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}

export function validateCvUpdate(data: unknown): { success: true; data: CvUpdateResultSchemaType } | { success: false; error: string } {
  const result = CvUpdateResultSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
