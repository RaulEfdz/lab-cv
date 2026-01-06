// =============================================================================
// CV LAB TYPES
// Types for the AI-powered CV builder
// =============================================================================

// -----------------------------------------------------------------------------
// CV JSON SCHEMA - The canonical structure for CV data
// -----------------------------------------------------------------------------

export interface CvLink {
  label: string
  url: string
}

export interface CvHeader {
  fullName: string
  headline: string
  location: string
  email: string
  phone: string
  links: CvLink[]
}

export interface CvExperience {
  id: string
  company: string
  role: string
  startDate: string // Format: MM/YYYY
  endDate: string | null // null = "Present"
  location: string
  bullets: string[] // STAR format bullets
}

export interface CvEducation {
  id: string
  institution: string
  degree: string
  field?: string
  dates: string // e.g., "2018 - 2022"
  gpa?: string
}

export interface CvSkills {
  hard: string[] // Technical skills
  soft: string[] // Soft skills
}

export interface CvCertification {
  id: string
  name: string
  issuer: string
  date?: string
  url?: string
}

export interface CvConstraints {
  onePage: boolean
  language: 'es' | 'en'
  targetRole: string
}

export interface CvJson {
  header: CvHeader
  summary: string
  experience: CvExperience[]
  education: CvEducation[]
  skills: CvSkills
  certifications: CvCertification[]
  keywords: string[] // ATS keywords
  constraints: CvConstraints
}

// Empty/default CV JSON for new CVs
export const EMPTY_CV_JSON: CvJson = {
  header: {
    fullName: '',
    headline: '',
    location: '',
    email: '',
    phone: '',
    links: []
  },
  summary: '',
  experience: [],
  education: [],
  skills: {
    hard: [],
    soft: []
  },
  certifications: [],
  keywords: [],
  constraints: {
    onePage: true,
    language: 'es',
    targetRole: ''
  }
}

// -----------------------------------------------------------------------------
// DATABASE TYPES
// -----------------------------------------------------------------------------

export type CvLabStatus = 'DRAFT' | 'READY' | 'CLOSED'

// LinkedIn connection data stored in cv_data
export interface LinkedInConnectionData {
  sub: string
  name: string
  email: string
  picture?: string
  connectedAt: string
}

// Extra metadata stored in cv_data JSONB column
export interface CvLabCvData {
  linkedinConnected?: boolean
  linkedinData?: LinkedInConnectionData
  header?: Partial<CvHeader>
  [key: string]: unknown
}

export interface CvLabCv {
  id: string
  title: string
  target_role: string | null
  industry: string | null
  language: string
  status: CvLabStatus
  readiness_score: number
  current_version_id: string | null
  cv_data?: CvLabCvData
  created_at: string
  updated_at: string
}

export interface CvLabVersion {
  id: string
  cv_id: string
  version_number: number
  cv_json: CvJson
  render_hash: string | null
  created_at: string
}

export interface CvLabMessage {
  id: string
  cv_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_in: number
  tokens_out: number
  created_at: string
}

export interface CvLabAsset {
  id: string
  cv_id: string
  file_name: string
  file_url: string
  file_key: string
  mime_type: string | null
  extracted_text: string | null
  created_at: string
}

// -----------------------------------------------------------------------------
// INSERT/UPDATE TYPES
// -----------------------------------------------------------------------------

export type CvLabCvInsert = Omit<CvLabCv, 'id' | 'created_at' | 'updated_at'>
export type CvLabCvUpdate = Partial<Omit<CvLabCvInsert, 'id'>>

export type CvLabVersionInsert = Omit<CvLabVersion, 'id' | 'created_at'>
export type CvLabVersionUpdate = Partial<Omit<CvLabVersionInsert, 'cv_id'>>

export type CvLabMessageInsert = Omit<CvLabMessage, 'id' | 'created_at'>

export type CvLabAssetInsert = Omit<CvLabAsset, 'id' | 'created_at'>

// -----------------------------------------------------------------------------
// API RESPONSE TYPES
// -----------------------------------------------------------------------------

export interface CvLabCvWithRelations extends CvLabCv {
  versions?: CvLabVersion[]
  messages?: CvLabMessage[]
  assets?: CvLabAsset[]
  current_version?: CvLabVersion | null
}

// Chat streaming response chunks
export interface ChatStreamChunk {
  type: 'text' | 'cv_update' | 'error' | 'done'
  content?: string
  cvUpdate?: CvUpdateResult
  error?: string
}

// Result from AI when it updates the CV
export interface CvUpdateResult {
  action: 'update_section' | 'full_update'
  section?: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications'
  data: Partial<CvJson>
  readinessScore: number
  feedback: string
}

// -----------------------------------------------------------------------------
// UI STATE TYPES
// -----------------------------------------------------------------------------

export interface CvLabState {
  cv: CvLabCv | null
  currentVersion: CvLabVersion | null
  versions: CvLabVersion[]
  messages: CvLabMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
}

// Readiness score breakdown for UI display
export interface ReadinessBreakdown {
  score: number
  details: {
    hasSummary: boolean
    hasExperience: boolean
    hasMetrics: boolean
    hasSkills: boolean
    hasGenericText: boolean
  }
  suggestions: string[]
}

// -----------------------------------------------------------------------------
// FEEDBACK LOOP TYPES
// -----------------------------------------------------------------------------

export type FeedbackType = 'rating' | 'comparison' | 'correction'

export type FeedbackTag =
  | 'too_verbose'
  | 'too_brief'
  | 'good_metrics'
  | 'invented_data'
  | 'good_format'
  | 'bad_format'
  | 'wrong_tone'
  | 'good_tone'
  | 'helpful'
  | 'not_helpful'
  | 'accurate'
  | 'inaccurate'

export interface CvLabFeedback {
  id: string
  message_id: string
  cv_id: string
  feedback_type: FeedbackType
  rating: number | null // 1-5
  preferred_over_message_id: string | null
  correction_text: string | null
  tags: FeedbackTag[]
  comment: string | null
  user_intent: string | null
  created_at: string
}

export interface CvLabPromptVersion {
  id: string
  version: string
  system_prompt: string
  is_active: boolean
  avg_rating: number
  total_ratings: number
  positive_ratings: number
  negative_ratings: number
  ab_test_group: string | null
  changelog: string | null
  created_at: string
  updated_at: string
}

export interface CvLabLearnedPattern {
  id: string
  pattern_type: 'preferred_phrase' | 'avoid_phrase' | 'format_rule' | 'tone_preference'
  pattern: string
  confidence: number
  reinforcement_count: number
  category: 'summary' | 'experience' | 'skills' | 'general'
  is_active: boolean
  examples: Array<{ text: string; isGood: boolean }>
  learned_instruction?: string // Dynamic instruction learned from feedback comments
  good_example?: string // Example of correct behavior
  bad_example?: string // Example of incorrect behavior
  created_at: string
  updated_at: string
}

// Feedback submission
export interface FeedbackSubmission {
  message_id: string
  cv_id: string
  feedback_type: FeedbackType
  rating?: number
  preferred_over_message_id?: string
  correction_text?: string
  tags?: FeedbackTag[]
  comment?: string
}

// Feedback stats for dashboard
export interface FeedbackStats {
  total_feedback: number
  avg_rating: number
  positive_percentage: number
  top_tags: Array<{ tag: FeedbackTag; count: number }>
  recent_patterns: CvLabLearnedPattern[]
}
