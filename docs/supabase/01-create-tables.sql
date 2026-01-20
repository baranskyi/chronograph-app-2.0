-- ============================================
-- CHRONOGRAPH APP - Database Schema
-- Выполнять в Supabase SQL Editor
-- ============================================

-- 1. Создание таблицы rooms (без active_timer_id пока)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code VARCHAR(9) UNIQUE NOT NULL,
  name VARCHAR(100) DEFAULT 'My Room',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Создание таблицы timers
CREATE TABLE IF NOT EXISTS timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 300,
  remaining_seconds INTEGER NOT NULL DEFAULT 300,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'stopped',
  is_on_air BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{"mode": "countdown", "soundEnabled": true, "flashEnabled": true, "overtimeEnabled": true, "yellowThreshold": 30, "redThreshold": 10}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создание таблицы sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  peak_viewers INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0
);

-- 4. Добавить колонку active_timer_id в rooms (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'active_timer_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN active_timer_id UUID;
  END IF;
END $$;

-- 5. Добавить foreign key constraint (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_active_timer' AND table_name = 'rooms'
  ) THEN
    ALTER TABLE rooms
      ADD CONSTRAINT fk_active_timer
      FOREIGN KEY (active_timer_id)
      REFERENCES timers(id)
      ON DELETE SET NULL;
  END IF;
END $$;
