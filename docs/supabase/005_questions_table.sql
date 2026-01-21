-- Questions table for audience Q&A feature
-- Users scan QR code, submit questions, moderator can send to speaker screen

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  target_timer_id UUID REFERENCES timers(id) ON DELETE SET NULL
);

-- Index for fast queries by room
CREATE INDEX IF NOT EXISTS idx_questions_room_id ON questions(room_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT questions (public submission)
CREATE POLICY "Anyone can submit questions"
  ON questions FOR INSERT
  WITH CHECK (true);

-- Policy: Room owner can SELECT questions for their rooms
CREATE POLICY "Room owners can view questions"
  ON questions FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE owner_id = auth.uid()
    )
  );

-- Policy: Room owner can UPDATE questions (change status, etc.)
CREATE POLICY "Room owners can update questions"
  ON questions FOR UPDATE
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE owner_id = auth.uid()
    )
  );

-- Policy: Room owner can DELETE questions
CREATE POLICY "Room owners can delete questions"
  ON questions FOR DELETE
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE owner_id = auth.uid()
    )
  );

-- Enable realtime for questions table
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
