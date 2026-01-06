import { NextRequest, NextResponse } from 'next/server'

// POST /api/cv-lab/training/init-progress - Initialize training progress
// Returns SQL that needs to be run in Supabase dashboard
export async function POST(request: NextRequest) {
  const sql = `
-- Training Levels System Tables
-- Run this in Supabase SQL Editor

-- Training Progress Table
CREATE TABLE IF NOT EXISTS cv_lab_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_level INTEGER DEFAULT 1,
    completed_levels INTEGER[] DEFAULT '{}',
    level_scores JSONB DEFAULT '{}',
    total_score INTEGER DEFAULT 0,
    skills_learned TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Tests Table (individual test results)
CREATE TABLE IF NOT EXISTS cv_lab_training_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER NOT NULL,
    scenario_id VARCHAR(50) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    passed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    feedback TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_tests_level ON cv_lab_training_tests(level);
CREATE INDEX IF NOT EXISTS idx_training_tests_passed ON cv_lab_training_tests(passed);
CREATE INDEX IF NOT EXISTS idx_training_progress_updated ON cv_lab_training_progress(updated_at DESC);

-- Add learned_instruction column if not exists
ALTER TABLE cv_lab_learned_patterns
ADD COLUMN IF NOT EXISTS learned_instruction TEXT;

-- RLS
ALTER TABLE cv_lab_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_tests ENABLE ROW LEVEL SECURITY;

-- Allow all for service role (training is public)
DROP POLICY IF EXISTS "allow_all_training_progress" ON cv_lab_training_progress;
CREATE POLICY "allow_all_training_progress" ON cv_lab_training_progress FOR ALL USING (true);
DROP POLICY IF EXISTS "allow_all_training_tests" ON cv_lab_training_tests;
CREATE POLICY "allow_all_training_tests" ON cv_lab_training_tests FOR ALL USING (true);

-- Insert initial progress record
INSERT INTO cv_lab_training_progress (current_level, completed_levels, total_score, skills_learned)
VALUES (1, '{}', 0, '{}')
ON CONFLICT DO NOTHING;
  `.trim()

  return NextResponse.json({
    message: 'Run this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)',
    sql
  })
}

// GET - Check if tables exist
export async function GET(request: NextRequest) {
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('cv_lab_training_progress')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({
      exists: false,
      error: error.message,
      instructions: 'Run POST /api/cv-lab/training/init-progress to get the SQL to run'
    })
  }

  return NextResponse.json({
    exists: true,
    progress: data
  })
}
